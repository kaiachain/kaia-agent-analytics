import { IncomingWebhook } from '@slack/webhook';
import { format } from 'date-fns';
import type { MetricAnalysis } from '../types/slack.js';

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

if (!slackWebhookUrl) {
  // Making the error throwing more robust for application stability
  throw new Error("SLACK_WEBHOOK_URL environment variable is not set.");
}

const webhook = new IncomingWebhook(slackWebhookUrl);

/**
 * Sends formatted metric analysis messages to Slack via Incoming Webhook using Block Kit.
 * The date is sent once at the beginning, followed by blocks for each metric.
 * @param metricsData An array of MetricAnalysis objects.
 */
export const sendFormattedSlackMessage = async (metricsData: MetricAnalysis[]): Promise<void> => {
  try {
    const allBlocks: any[] = []; // Initialize array to hold all blocks

    // 1. Generate and add the date block ONCE
    const now = new Date();
    const formattedDate = format(now, "PPPpp"); // e.g., "Aug 17, 2024, 5:30:00 PM"
    allBlocks.push({
        type: "header",
        text: {
            type: "plain_text",
            text: `Date: ${formattedDate}`
        }
    });
     allBlocks.push({ type: "divider" }); // Add a divider after the date

    // 2. Loop through metrics and collect their blocks
    for (const metric of metricsData) {
        const metricBlocks = [
             {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${metric.metricName}*`
                 },
                 accessory: {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "View on Dune",
                        emoji: true
                    },
                    url: metric.sectionUrl,
                    action_id: `view_dune_${metric.metricName.replace(/\s+/g, '_')}`
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: metric.technicalAnalysis
                }
            },
             {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `*Significance:* ${metric.significance}`
                    }
                ]
             },
            {
                type: "divider"
            }
        ];
        allBlocks.push(...metricBlocks); // Add metric-specific blocks to the main array
        console.log(`Prepared blocks for metric: ${metric.metricName}`);
    }

    // 3. Construct the final payload and send ONCE
    if (allBlocks.length > 2) { // Ensure there's more than just date and divider
        const payload = {
            blocks: allBlocks
        };
        await webhook.send(payload);
        console.log("Finished sending combined metric update to Slack.");
    } else {
        console.log("No metrics data provided to send.");
    }

  } catch (error) {
    console.error("Error sending formatted message to Slack:", error);
    throw error;
  }
};
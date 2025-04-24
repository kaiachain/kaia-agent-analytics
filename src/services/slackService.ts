/**
 * Slack Service
 * 
 * Provides functionality to send formatted messages to Slack using Webhooks.
 * Uses Block Kit to create rich, interactive messages with metric analytics data.
 */
import { IncomingWebhook } from '@slack/webhook';
import { format } from 'date-fns';
import type { MetricAnalysis } from '../types/slack.js';

// Get the webhook URL from environment variables
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

// Validate that the webhook URL is available
if (!slackWebhookUrl) {
  throw new Error("SLACK_WEBHOOK_URL environment variable is not set.");
}

// Initialize the Slack webhook with the URL
const webhook = new IncomingWebhook(slackWebhookUrl);

/**
 * Sends formatted metric analysis messages to Slack via Incoming Webhook using Block Kit.
 * 
 * Message structure:
 * 1. Header with current date/time
 * 2. A section for each metric including:
 *    - Metric name with a button linking to Dune
 *    - Technical analysis text
 *    - Significance level
 *    - Divider between metrics
 * 
 * @param metricsData - An array of MetricAnalysis objects containing analysis results
 * @returns Promise that resolves when the message is sent
 * @throws Error when message sending fails
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
        // Create blocks for each metric with its data
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
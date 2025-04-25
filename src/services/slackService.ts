/**
 * Slack Service
 * 
 * Provides functionality to send formatted messages to Slack using Webhooks.
 * Uses Block Kit to create rich, interactive messages with metric analytics data.
 */
import { IncomingWebhook } from '@slack/webhook';
import { format } from 'date-fns';
import type { MetricAnalysis } from '../types';
import { logger, asyncErrorHandler } from '../utils';

// Get the webhook URL from environment variables
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

// Validate that the webhook URL is available
if (!slackWebhookUrl) {
  const error = new Error("SLACK_WEBHOOK_URL environment variable is not set.");
  logger.error(error.message);
  throw error;
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
export const sendFormattedSlackMessage = asyncErrorHandler(async (metricsData: MetricAnalysis[]): Promise<void> => {
  logger.info(`Preparing to send metric analysis to Slack`, { metricCount: metricsData.length });
  
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
      logger.info(`Building Slack blocks for metric: ${metric.metricName}`, { significance: metric.significance });
      
      // Create blocks for each metric with its data
      const metricBlocks = [
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
              type: "divider"
          }
      ];
      allBlocks.push(...metricBlocks); // Add metric-specific blocks to the main array
  }

  // 3. Construct the final payload and send ONCE
  if (allBlocks.length > 2) { // Ensure there's more than just date and divider
      const payload = {
          blocks: allBlocks
      };
      
      logger.info(`Sending Slack message with ${metricsData.length} metrics`);
      
      const startTime = Date.now();
      await webhook.send(payload);
      const duration = Date.now() - startTime;
      
      logger.info(`Successfully sent Slack message`, { 
        duration: `${duration}ms`,
        blockCount: allBlocks.length 
      });
  } else {
      logger.warn("No metrics data provided to send to Slack");
  }
}, "Slack Service");
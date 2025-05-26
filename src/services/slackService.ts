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

logger.debug('Slack webhook initialized', {
  webhookUrlProvided: !!slackWebhookUrl,
  webhookUrlLength: slackWebhookUrl?.length || 0
});

/**
 * Creates a grid-style metrics display using Slack block format
 * This approach displays metrics inline with a simple key-value format
 * 
 * @param metricsData - Array of MetricAnalysis objects to format as a grid
 * @returns An array of Slack blocks representing the metrics in a grid
 */
const createMetricsGrid = (metricsData: MetricAnalysis[]): any[] => {
  logger.debug('Creating inline metrics layout for Slack', { metricsCount: metricsData.length });
  
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Metrics Summary",
        emoji: true
      }
    }
  ];
  
  // Add each metric as a section with inline text
  for (const metric of metricsData) {
    
    // Add the metric heading with View on Dune button
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${metric.metricName}*\n_Significance: ${metric.significance == 'HIGH' ? 'HIGH ❗️' : metric.significance == 'MEDIUM' ? 'MEDIUM ⚠️' : 'LOW'}_`
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View on Dune",
          emoji: true
        },
        url: metric.sectionUrl,
      }
    });
    
    // Add metrics data inline using the format specified
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Latest:* ${metric.latestValue}\n*Change (from last ${metric.frequency}):* ${metric.percentageChange} (${metric.absoluteChange})${parseInt(metric.percentageChange) > 0 ? ' 🟢' : ' 🔴'}\n*Historical Average (${metric.fromHistoricalDate}):* ${metric.historicalAverage}`
      }
    });

    // Add historical trend if available
    if (metric.historicalTrend) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Historical Trend:* ${metric.historicalTrend}`
        }
      });
    }
    
    // Add technical analysis if available
    if (metric.technicalAnalysis) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Technical Analysis:* ${metric.technicalAnalysis}`
        }
      });
    }
    
    // Add a divider between metrics
    blocks.push({
      type: "divider"
    });
  }
  
  logger.debug('Inline metrics created successfully', { blockCount: blocks.length });
  return blocks;
};

/**
 * Creates a table-style metrics display using Slack block format.
 * This approach uses fields to simulate a table layout.
 * 
 * @param metricsData - Array of MetricAnalysis objects to format as a table
 * @returns An array of Slack blocks representing the metrics in a table
 */
const createMetricsTable = (metricsData: MetricAnalysis[]): any[] => {
  logger.debug('Creating table-style metrics layout for Slack', { metricsCount: metricsData.length });

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Metrics Overview Table",
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        "*Metric Name*", "*Latest Value*", "*Significance*", "*Change*"
      ].map((header) => ({
        type: "mrkdwn",
        text: header
      }))
    },
    {
      type: "divider"
    }
  ];

  for (const metric of metricsData) {
    blocks.push({
      type: "section",
      fields: [
        `*${metric.metricName}*`,
        `${metric.latestValue}`,
        `${metric.significance == 'HIGH' ? 'HIGH ❗️' : metric.significance == 'MEDIUM' ? 'MEDIUM ⚠️' : 'LOW'}`,
        `${metric.percentageChange} (${metric.absoluteChange})${parseInt(metric.percentageChange) > 0 ? ' 🟢' : ' 🔴'}`,
      ].map((value) => ({
        type: "mrkdwn",
        text: value
      }))
    });

    blocks.push({
      type: "divider"
    });
  }

  logger.debug('Table-style metrics created successfully', { blockCount: blocks.length });
  return blocks;
};

/**
 * Sends a formatted message to Slack displaying metrics data in a grid layout.
 * 
 * This function prepares a structured Slack message with:
 * 1. A header showing the current date and time
 * 2. A grid layout of metrics with their key values
 * 3. For each metric, displays:
 *    - Metric name and significance
 *    - Latest value, percentage change, and historical average
 *    - Technical analysis (if available)
 *    - A "View on Dune" button linking to the metric's source
 * 
 * The function will not send a message if no metrics data is provided.
 * 
 * @param metricsData - Array of metric analysis objects to be displayed in the Slack message
 * @returns A Promise that resolves when the message has been sent successfully
 * @throws Will propagate any errors that occur during message preparation or sending,
 *         but these are handled by the asyncErrorHandler wrapper
 */
export const sendGridFormattedSlackMessage = asyncErrorHandler(async (metricsData: MetricAnalysis[]): Promise<void> => {
  logger.info(`Preparing to send metric analysis to Slack with grid and table layout`, { metricCount: metricsData.length });

  const allBlocks: any[] = []; 

  // 1. Generate and add the date block
  const now = new Date();
  const formattedDate = format(now, "PPPpp");
  allBlocks.push({
      type: "header",
      text: {
          type: "plain_text",
          text: `Date: ${formattedDate}`
      }
  });
  allBlocks.push({ type: "divider" });

  // 2. Add the metrics table
  const tableBlocks = createMetricsTable(metricsData);
  allBlocks.push(...tableBlocks);

  // 3. Add the metrics grid
  const gridBlocks = createMetricsGrid(metricsData);
  allBlocks.push(...gridBlocks);

  // 4. Send the message
  if (allBlocks.length > 2) {
    const payload = { blocks: allBlocks };
    await webhook.send(payload);
    logger.info(`Successfully sent Slack message with grid and table layout`);
  } else {
    logger.warn("No metrics data provided to send to Slack");
  }
}, "Slack Service");
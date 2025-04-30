/**
 * Kaia Agent Analytics - Main Entry Point
 *
 * This application fetches blockchain metrics from Dune Analytics,
 * analyzes the data using Google's Gemini AI model, and sends
 * formatted insights to a Slack channel via webhooks.
 *
 * The workflow is:
 * 1. Fetch latest data for each configured metric from Dune
 * 2. Generate AI analysis using Gemini
 * 3. Format and send results to Slack
 */
import "dotenv/config";
import cron from "node-cron";
import type { Metric, MetricAnalysis } from "./types/index";
import { METRICS } from "./constants/index";
import {
  getLatestResult,
  generateContent,
  sendGridFormattedSlackMessage
} from "./services/index";
import {
  logger,
  asyncErrorHandler,
  setupGlobalErrorHandlers,
} from "./utils/index";

// Setup global error handlers
setupGlobalErrorHandlers();

// Log current configuration
logger.debug("Application configuration", {
  debugLogsEnabled: process.env.DEBUG_LOGS?.toLowerCase() === "true",
  metricsCount: METRICS.length,
});

/**
 * Generates the analysis prompt for a given metric and its data
 *
 * @param metric - Metric configuration object containing metadata
 * @param data - Raw JSON string data from Dune Analytics
 * @returns A formatted prompt string for the Gemini AI model
 */
function createAnalysisPrompt(metric: Metric, data: string | null): string {
  logger.debug(`Creating analysis prompt for ${metric.name}`, {
    metric,
    dataLength: data?.length || 0,
  });

  return `
You are provided with the latest time-series data for the metric: ${metric.name}. Your task is to analyze this data and provide insights in JSON format.

Follow these steps:
1.  Identify the two most recent dates from the provided data (let's call them 'latest_value' and 'previous_value'). Today's date is '${new Date().toISOString().split("T")[0]}'. The latest data point is the most recent one, and the previous data point is the one before it. 
2.  Calculate the absolute change between these two points: 'recent_absolute_change' = latest_value - previous_value.
3.  Calculate the percentage change: 'recent_percentage_change' = (recent_absolute_change / previous_value) * 100. Handle division by zero if previous_value is 0.
4.  Analyze the historical trend based on metric frequency:
    - If the frequency is '${metric.frequency}' and the historical period is from '${metric.fromHistoricalDate}', extract all data points within this period.
    - Calculate the trend between consecutive data points throughout the entire historical period.
    - Identify any patterns, cycles, or anomalies in the historical trend.
    - Calculate the 'historical_average' value across the entire period.
5.  Compare the most recent trend with the historical trend:
    - Determine if the recent change is following the established historical pattern or deviating from it.
    - Identify if the latest data point represents an acceleration, deceleration, or reversal of the historical trend.
6.  Based on this comprehensive trend analysis, provide a concise technical analysis (around 20-30 words) that discusses:
    - How the latest change compares to the historical trend
    - Whether the metric is showing unusual behavior compared to its historical pattern
    - Any potential explanations for significant deviations from the established trend
7.  Determine the significance level based on the following criteria:
    - LOW: If abs(recent_absolute_change) <= 0.5 * historical_average
    - MEDIUM: If 0.5 * historical_average < abs(recent_absolute_change) <= historical_average
    - HIGH: If historical_average < abs(recent_absolute_change) <= 2 * historical_average
    - CRITICAL: If abs(recent_absolute_change) > 2 * historical_average

Format all numerical values as follows:
- Round all numbers to the nearest integer, except for percentage changes (e.g., 992.6051817027819 → 993, but 9.123456% → 9.12%)
- Add appropriate units to all numbers (e.g., $, ETH, transactions, users)
- Use the international number system with commas (e.g., 1,234,567)
- For large numbers, use abbreviated formats: thousands (K), millions (M), billions (B), etc. (e.g., $59,239,487 → $59.2M)
- Show percentage changes with up to 2 decimal places (e.g., +15.25%) along with the sign (+ or -)

${metric.additionalPrompt || ""}

Output your response strictly in the following JSON format:
{
    "metricName": "${metric.name}", //string
    "sectionUrl": "${metric.sectionUrl}", //string
    "frequency": "${metric.frequency}", //string
    "fromHistoricalDate": "${metric.fromHistoricalDate}", //string
    "latestValue": "The most recent data point value with proper formatting", //string
    "absoluteChange": "The calculated recent_absolute_change with proper formatting", //string
    "percentageChange": "The calculated recent_percentage_change with proper formatting (e.g., '+15.25%' or '-5.01%')", //string
    "historicalAverage": "The calculated historical_average with proper formatting", //string
    "historicalTrend": "A brief description of the historical trend pattern", //string
    "technicalAnalysis": "Your comprehensive technical analysis comparing recent and historical trends", //string
    "significance": "LOW | MEDIUM | HIGH | CRITICAL" //string
}
    
Here is the data:
${data}
`;
}

/**
 * Parse the Gemini response and handle potential errors
 *
 * @param geminiResult - Raw response from Gemini API
 * @param metricName - Name of the metric for error reporting
 * @returns Parsed MetricAnalysis object or error information
 */
function parseGeminiResponse(
  geminiResult: string | null,
  metricName: string
): MetricAnalysis | Record<string, any> {
  logger.debug(`Parsing Gemini response for metric: ${metricName}`, {
    responseType: typeof geminiResult,
    responseLength: typeof geminiResult === "string" ? geminiResult.length : 0,
  });

  if (typeof geminiResult !== "string") {
    logger.error(`Received non-string result for metric ${metricName}`, {
      rawResult: geminiResult,
    });
    return {
      error: `Received non-string result for metric ${metricName}`,
      rawResult: geminiResult,
    };
  }

  // Clean the string: remove markdown fences and trim whitespace
  const cleanedResult = geminiResult
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  try {
    const parsedResult = JSON.parse(cleanedResult);
    logger.debug(
      `Successfully parsed JSON response for metric: ${metricName}`,
      {
        significance: parsedResult.significance,
        latestValue: parsedResult.latestValue,
      }
    );
    return parsedResult;
  } catch (error) {
    logger.error(`Failed to parse JSON for metric ${metricName}`, {
      error: error instanceof Error ? error.message : String(error),
      rawResult: geminiResult,
      cleanedResult: cleanedResult,
    });
    return {
      error: `Failed to parse JSON for metric ${metricName}`,
      rawResult: geminiResult,
      cleanedResult: cleanedResult,
    };
  }
}

/**
 * Process a single metric by fetching data and generating analysis
 *
 * The function pipeline:
 * 1. Fetches data from Dune Analytics
 * 2. Creates an analysis prompt
 * 3. Sends prompt to Gemini AI
 * 4. Parses and validates the response
 *
 * @param metric - Metric configuration object
 * @returns Promise resolving to analysis results or error information
 */
const processMetric = asyncErrorHandler(
  async (metric: Metric): Promise<MetricAnalysis | Record<string, any>> => {
    logger.info(`Awaiting data from Dune for metric: ${metric.name}`, {
      metricId: metric.queryId,
    });
    logger.debug(`Requesting Dune data with parameters`, {
      queryId: metric.queryId,
      limit: metric.limit,
      frequency: metric.frequency,
    });

    // Fetch the latest data for this metric from Dune
    const data = await getLatestResult(metric.queryId, metric.limit);

    logger.info(`Data fetched from Dune for metric: ${metric.name}`, {});
    logger.debug(`Dune data details`, {
      dataReceived: !!data,
      dataSize: data?.length || 0,
    });

    // Create the analysis prompt for this metric
    const prompt = createAnalysisPrompt(metric, data);

    logger.info(`Awaiting Gemini response for metric: ${metric.name}`, {
      metricId: metric.queryId,
    });
    logger.debug(`Sending prompt to Gemini API`, {
      promptLength: prompt.length,
      model: "gemini-2.5-flash-preview-04-17",
    });

    // Generate content analysis using Gemini
    const geminiResult = await generateContent({
      modelName: "gemini-2.5-flash-preview-04-17",
      systemInstruction:
        "You are an expert AI blockchain data analyst. Your knowledge includes all standard data analysis techniques and deep expertise in blockchain ecosystems. You excel at retrieving data from Dune Analytics and performing technical analysis on it. Focus on providing accurate, data-driven blockchain insights based on Dune Analytics data.",
      prompt: prompt,
    });

    logger.info(`Received Gemini response for metric: ${metric.name}`);

    // Parse the result and handle any errors
    return parseGeminiResponse(geminiResult, metric.name);
  },
  "Metric Processing"
);

/**
 * Main function to run the analysis and reporting process
 *
 * Executes the entire analytics pipeline:
 * 1. Processes all metrics in parallel for efficiency
 * 2. Sends formatted results to Slack
 * 3. Handles any errors in the process
 */
const main = asyncErrorHandler(async (): Promise<void> => {
  logger.info(`Running analytics job`, { timestamp: new Date().toISOString() });
  logger.debug(`Starting parallel processing of ${METRICS.length} metrics`, {
    metricIds: METRICS.map((m) => m.queryId),
  });

  // Process all metrics in parallel
  const results = await Promise.all(METRICS.map(processMetric));

  logger.debug(`Completed processing all metrics`, {
    resultsCount: results.length,
    successfulResults: results.filter((r) => !("error" in r)).length,
    errorResults: results.filter((r) => "error" in r).length,
  });

  // Send the results to Slack
  await sendGridFormattedSlackMessage(results as MetricAnalysis[]);

  logger.info("Slack message sent successfully");
  logger.debug("Analytics job completed successfully", {
    timestamp: new Date().toISOString(),
  });
}, "Main Process");

// Get cron schedule from .env file
const cronSchedule = process.env.CRON_SCHEDULE;

// Only schedule the job if a cron schedule is provided in .env
if (cronSchedule) {
  logger.debug(`Cron schedule loaded from environment: ${cronSchedule}`, {
    cronSchedule: cronSchedule,
  });

  // Get timezone from .env file or use default (Singapore Time)
  const timezone = process.env.TZ || "Asia/Singapore";
  logger.debug(`Timezone loaded from environment: ${timezone}`, {
    timezone: timezone,
  });

  // Check if the cron schedule is valid
  if (!cron.validate(cronSchedule)) {
    logger.error(`Invalid cron schedule: ${cronSchedule}`, {
      usingDefault: true,
      defaultSchedule: "0 10 * * 1",
    });
  }

  logger.info(`Starting Kaia Agent Analytics service`, {
    schedule: cronSchedule,
    timezone: timezone,
  });

  // Schedule the main job with cron using the configured timezone
  cron.schedule(
    cronSchedule,
    () => {
      main();
    },
    {
      scheduled: true,
      timezone: timezone, // Use configured timezone
    }
  );
}
else {
  logger.warn(`No cron schedule provided. Running immediately.`);
  main();
}

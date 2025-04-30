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
import type { Metric, MetricAnalysis, HistoricalPeriod } from "./types/index";
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
 * Formats a HistoricalPeriod object into a human-readable description relative to the current date.
 *
 * @param period - A HistoricalPeriod object describing the historical period.
 * @returns A formatted string describing the period (e.g., "for months January to March", "for year 2024", "for date 2025-04-29", "from 2025-04-24").
 */
function formatHistoricalPeriodDescription(period: HistoricalPeriod): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Use UTC start of day

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get month name
  const getMonthName = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
  };

  switch (period.type) {
    case 'relativeRange': {
      const { count, unit } = period;
      if (count <= 0) return "Invalid range";
      const endDate = new Date(today);
      const startDate = new Date(today);

      switch (unit) {
        case 'day':
          endDate.setUTCDate(today.getUTCDate() - 1);
          startDate.setUTCDate(today.getUTCDate() - count);
          return `for dates ${formatDate(startDate)} to ${formatDate(endDate)}`;
        case 'week':
          endDate.setUTCDate(today.getUTCDate() - today.getUTCDay() - 1); // End of last week (Sunday-Saturday)
          startDate.setUTCDate(endDate.getUTCDate() - (count - 1) * 7);
          startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay()); // Start of that week (Sunday)
          return `for dates ${formatDate(startDate)} to ${formatDate(endDate)}`;
        case 'month':
          endDate.setUTCDate(0); // Last day of previous month
          startDate.setUTCMonth(today.getUTCMonth() - count, 1); // First day of the start month
          // Handle case where count is 1 separately for single month name
          if (count === 1) {
             return `for month ${getMonthName(endDate)}`;
          }
          return `for months ${getMonthName(startDate)} to ${getMonthName(endDate)}`;
        case 'year':
          const endYear = today.getUTCFullYear() - 1;
          const startYear = today.getUTCFullYear() - count;
           // Handle case where count is 1 separately for single year
          if (count === 1) {
             return `for year ${endYear}`;
          }
          return `for years ${startYear} to ${endYear}`;
      }
      break; // Should not be reached due to inner returns
    }

    case 'relativeSpecific': {
      switch (period.period) {
        case 'today':
          return `for date ${formatDate(today)}`;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setUTCDate(today.getUTCDate() - 1);
          return `for date ${formatDate(yesterday)}`;
        case 'thisWeek':
           const startOfWeek = new Date(today);
           startOfWeek.setUTCDate(today.getUTCDate() - today.getUTCDay());
           return `for week starting ${formatDate(startOfWeek)}`;
        case 'lastWeek':
           const endOfLastWeek = new Date(today);
           endOfLastWeek.setUTCDate(today.getUTCDate() - today.getUTCDay() - 1);
           const startOfLastWeek = new Date(endOfLastWeek);
           startOfLastWeek.setUTCDate(endOfLastWeek.getUTCDate() - 6);
           return `for week ${formatDate(startOfLastWeek)} to ${formatDate(endOfLastWeek)}`;
        case 'thisMonth':
          const startOfMonth = new Date(today);
          startOfMonth.setUTCDate(1);
          return `for month ${getMonthName(startOfMonth)} ${startOfMonth.getUTCFullYear()}`;
        case 'lastMonth':
          const lastMonthDate = new Date(today);
          lastMonthDate.setUTCDate(0); // Go to last day of previous month
          return `for month ${getMonthName(lastMonthDate)} ${lastMonthDate.getUTCFullYear()}`;
        case 'thisYear':
          return `for year ${today.getUTCFullYear()}`;
        case 'lastYear':
          return `for year ${today.getUTCFullYear() - 1}`;
      }
      break; // Should not be reached
    }

    case 'specificMonth': {
      const date = new Date(Date.UTC(period.year, period.month, 1));
      return `for month ${getMonthName(date)} ${period.year}`;
    }

    case 'specificYear':
      return `for year ${period.year}`;

    case 'specificDate':
      // Check if the specific date is yesterday or today relative to the *actual* run time
      const specificD = new Date(period.date + 'T00:00:00Z'); // Parse as UTC
      const yesterday = new Date(today);
      yesterday.setUTCDate(today.getUTCDate() - 1);
      if (specificD.getTime() === today.getTime()) return `for date ${formatDate(today)} (today)`;
      if (specificD.getTime() === yesterday.getTime()) return `for date ${formatDate(yesterday)} (yesterday)`;
      // Otherwise, just state the date
      return `from ${period.date}`;

    default:
      // This should not happen with TypeScript checking, but good practice
      logger.warn('Unrecognized HistoricalPeriod type', { period });
      // Attempt to safely stringify the object for logging/debugging
      try {
        return `Invalid period object: ${JSON.stringify(period)}`;
      } catch {
        return "Invalid period object";
      }
  }
  // Fallback if somehow a case doesn't return
  return "Unknown period";
}

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

  // Format the historical period description using the new object structure
  const historicalPeriodDescription = formatHistoricalPeriodDescription(metric.fromHistoricalDate);

  return `
You are provided with the latest time-series data for the metric: ${metric.name}. Your task is to analyze this data and provide insights in JSON format.

Follow these steps:
1.  Identify the two most recent dates from the provided data (let's call them 'latest_value' and 'previous_value'). Today's date is '${new Date().toISOString().split("T")[0]}'. The latest data point is the most recent one, and the previous data point is the one before it. 
2.  Calculate the absolute change between these two points: 'recent_absolute_change' = latest_value - previous_value.
3.  Calculate the percentage change: 'recent_percentage_change' = (recent_absolute_change / previous_value) * 100. Handle division by zero if previous_value is 0.
4.  Analyze the historical trend based on metric frequency:
    - If the frequency is '${metric.frequency}ly' and the historical period is ${historicalPeriodDescription}, extract all data points within this period.
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

Strictly format all numerical values as follows:
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
    "fromHistoricalDate": "${historicalPeriodDescription}", //string
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

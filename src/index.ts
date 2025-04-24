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
import cron from 'node-cron';
import type { Metric, MetricAnalysis } from "./types/index.js";
import { METRICS } from "./constants/index.js";
import { getLatestResult, generateContent, sendFormattedSlackMessage } from "./services/index.js";

/**
 * Generates the analysis prompt for a given metric and its data
 * 
 * @param metric - Metric configuration object containing metadata
 * @param data - Raw JSON string data from Dune Analytics
 * @returns A formatted prompt string for the Gemini AI model
 */
function createAnalysisPrompt(metric: Metric, data: string | null): string {
  return `
You are provided with the latest time-series data for the metric: ${metric.name}. Your task is to analyze this data and provide insights in JSON format.

Follow these steps:
1.  Identify the two most recent data points from the provided data (let's call them 'latest_value' and 'previous_value').
2.  Calculate the absolute change between these two points: 'recent_absolute_change' = latest_value - previous_value.
3.  Calculate the percentage change: 'recent_percentage_change' = (recent_absolute_change / previous_value) * 100. Handle division by zero if previous_value is 0.
4.  Calculate the average value of the data over the past ${metric.frequency} period, for ${metric.fromHistoricalDate}. Let's call this 'historical_average'.
5.  Compare the 'recent_absolute_change' with the 'historical_average'.
6.  Based on this comparison, provide a concise technical analysis (around 50-60 words) focusing on the significance of the most recent change relative to the historical average trend. **Explicitly mention the latest_value, recent_absolute_change, recent_percentage_change, and historical_average in your analysis.**
7.  Determine the significance level based on the following criteria:
    - LOW: If abs(recent_absolute_change) <= 0.5 * historical_average
    - MEDIUM: If 0.5 * historical_average < abs(recent_absolute_change) <= historical_average
    - HIGH: If historical_average < abs(recent_absolute_change) <= 2 * historical_average
    - CRITICAL: If abs(recent_absolute_change) > 2 * historical_average

Output your response strictly in the following JSON format:
{
    "metricName": "${metric.name}", //string
    "sectionUrl": "${metric.sectionUrl}", //string
    "latestValue": "The most recent data point value", //number
    "absoluteChange": "The calculated recent_absolute_change", //number
    "percentageChange": "The calculated recent_percentage_change (e.g., '+15.2%' or '-5.0%')", //number
    "historicalAverage": "The calculated historical_average", //number
    "technicalAnalysis": "Your concise technical analysis here, including the key numerical values.", //string
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
function parseGeminiResponse(geminiResult: string | null, metricName: string): MetricAnalysis | Record<string, any> {
  if (typeof geminiResult !== 'string') {
    console.error(`Received non-string result for metric ${metricName}:`, geminiResult);
    return { 
      error: `Received non-string result for metric ${metricName}`, 
      rawResult: geminiResult 
    };
  }
  
  // Clean the string: remove markdown fences and trim whitespace
  const cleanedResult = geminiResult.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  
  try {
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error(`Failed to parse JSON for metric ${metricName}:`, error);
    console.error(`Raw Gemini result:`, geminiResult);
    console.error(`Cleaned Gemini result:`, cleanedResult);
    return { 
      error: `Failed to parse JSON for metric ${metricName}`, 
      rawResult: geminiResult, 
      cleanedResult: cleanedResult 
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
async function processMetric(metric: Metric): Promise<MetricAnalysis | Record<string, any>> {
  // Fetch the latest data for this metric from Dune
  const data = await getLatestResult(metric.queryId, metric.limit);
  
  // Create the analysis prompt for this metric
  const prompt = createAnalysisPrompt(metric, data);
  
  // Generate content analysis using Gemini
  const geminiResult = await generateContent({
    modelName: "gemini-2.0-flash",
    systemInstruction: "You are an expert AI blockchain data analyst. Your knowledge includes all standard data analysis techniques and deep expertise in blockchain ecosystems. You excel at retrieving data from Dune Analytics and performing technical analysis on it. Focus on providing accurate, data-driven blockchain insights based on Dune Analytics data.",
    prompt: prompt,
  });
  
  // Parse the result and handle any errors
  return parseGeminiResponse(geminiResult, metric.name);
}

/**
 * Main function to run the analysis and reporting process
 * 
 * Executes the entire analytics pipeline:
 * 1. Processes all metrics in parallel for efficiency
 * 2. Sends formatted results to Slack
 * 3. Handles any errors in the process
 */
async function main(): Promise<void> {
  try {
    console.log(`Running analytics job at: ${new Date().toISOString()}`);
    
    // Process all metrics in parallel
    const results = await Promise.all(METRICS.map(processMetric));
    
    // Send the results to Slack
    await sendFormattedSlackMessage(results as MetricAnalysis[]);
    
    console.log("Slack message sent successfully");
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

// Get cron schedule from .env file or use default (every monday at 10:00 AM singapore time)
const cronSchedule = process.env.CRON_SCHEDULE || "0 10 * * 1";

// Check if the cron schedule is valid
if (!cron.validate(cronSchedule)) {
  console.error(`Invalid cron schedule: ${cronSchedule}`);
  console.error("Using default schedule: 0 10 * * 1");
}

console.log(`Starting Kaia Agent Analytics service with schedule: ${cronSchedule} (Singapore Time)`);

// Schedule the main job with cron - using Singapore Time (UTC+8)
cron.schedule(cronSchedule, () => {
  main();
}, {
  scheduled: true,
  timezone: "Asia/Singapore" // Set timezone to Singapore Time
});

// Also run the job once on startup
main();
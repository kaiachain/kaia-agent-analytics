import fs from 'fs';
import "dotenv/config";
import getLatestResult from "./services/duneService.ts";
import { metrics } from "./constants/metric.ts";
import generateContent from "./services/geminiService.ts";
import { sendFormattedSlackMessage } from "./services/slackService.ts";
const results = await Promise.all(metrics.map(async metric => {
    const result = await getLatestResult(metric.queryId, metric.limit);

    const finalPrompt = `
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
${result}
`;

    const geminiResult = await generateContent({
        modelName: "gemini-2.0-flash",
        systemInstruction: "You are an expert AI blockchain data analyst. Your knowledge includes all standard data analysis techniques and deep expertise in blockchain ecosystems. You excel at retrieving data from Dune Analytics and performing technical analysis on it. Focus on providing accurate, data-driven blockchain insights based on Dune Analytics data.",
        prompt: finalPrompt,
    });
    // Parse the JSON string returned by Gemini into a JavaScript object
    if (typeof geminiResult === 'string') {
        // Clean the string: remove markdown fences and trim whitespace
        const cleanedResult = geminiResult.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        try {
            return JSON.parse(cleanedResult);
        } catch (error) {
            console.error(`Failed to parse JSON for metric ${metric.name}:`, error);
            console.error(`Raw Gemini result:`, geminiResult);
            console.error(`Cleaned Gemini result:`, cleanedResult);
            // Return an error object, so Promise.all doesn't fail completely
            return { error: `Failed to parse JSON for metric ${metric.name}`, rawResult: geminiResult, cleanedResult: cleanedResult };
        }
    } else {
        console.error(`Received non-string result for metric ${metric.name}:`, geminiResult);
        // Return an error object if the result is not a string
        return { error: `Received non-string result for metric ${metric.name}`, rawResult: geminiResult };
    }
}));

// Send the results to Slack
await sendFormattedSlackMessage(results);

console.log("Slack message sent successfully");
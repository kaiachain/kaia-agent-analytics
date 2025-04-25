/**
 * Dune Analytics Service
 * 
 * Provides functionality to fetch blockchain data from Dune Analytics.
 * Uses the official Dune Analytics Client SDK to retrieve query results.
 */
import { DuneClient } from "@duneanalytics/client-sdk";
import { logger, asyncErrorHandler } from "../utils/index";

// Get the API key from environment variables
const duneApiKey = process.env.DUNE_API_KEY;

// Validate that the API key is available
if (!duneApiKey) {
    const error = new Error("DUNE_API_KEY environment variable is not set.");
    logger.error(error.message);
    throw error;
}

// Initialize the Dune client with the API key
const client = new DuneClient(duneApiKey);

/**
 * Fetches the latest result for a specific Dune query
 * 
 * @param queryId - The ID of the Dune query to fetch
 * @param limit - Maximum number of rows to return
 * @returns Promise resolving to a formatted string of data rows or null on error
 */
const getLatestResult = asyncErrorHandler(async (queryId: number, limit: number): Promise<string | null> => {
    // Fetch the latest result from Dune
    const response = await client.getLatestResult({ queryId });
    const rows = response.result?.rows;
    
    if (rows) {
        // Take only the requested number of rows and convert to string format
        const lastRows = rows.slice(0, limit);
        return lastRows.map(row => JSON.stringify(row)).join("\n");
    }
    
    // Log a warning if rows are not found for the given queryId
    logger.warn(`No results found for Dune query ID: ${queryId}`);
    return null;
}, "Dune Service");

export default getLatestResult;
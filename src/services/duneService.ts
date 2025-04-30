/**
 * Dune Analytics Service
 * 
 * Provides functionality to fetch blockchain data from Dune Analytics.
 * Uses the official Dune Analytics Client SDK to retrieve query results.
 */
import { logger, asyncErrorHandler } from "../utils";
import fetch from "node-fetch";

// Get the API key from environment variables
const duneApiKey = process.env.DUNE_API_KEY;

// Validate that the API key is available
if (!duneApiKey) {
    const error = new Error("DUNE_API_KEY environment variable is not set.");
    logger.error(error.message);
    throw error;
}

logger.debug('Dune Analytics client initialized', {
    apiKeyProvided: !!duneApiKey,
    apiKeyLength: duneApiKey?.length || 0
});

/**
 * Fetches Dune query results as CSV.
 * @param queryId - The Dune query ID
 * @param apiKey - The Dune API key
 * @param limit - Number of results to fetch (default: 1000)
 * @returns CSV string of results
 */
async function getLatestResult(queryId: number, limit: number): Promise<string> {
    const url = `https://api.dune.com/api/v1/query/${queryId}/results/csv?limit=${limit}`;
    const response = await fetch(url, {
        headers: {
            "X-Dune-API-Key": duneApiKey as string
        }
    });
    if (!response.ok) {
        logger.error(`Failed to fetch Dune query results: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch Dune query results: ${response.status} ${response.statusText}`);
    }
    // console.log('Dune query results fetched successfully', await response.text());
    return await response.text();
}

export default getLatestResult;
import { DuneClient } from "@duneanalytics/client-sdk";

const duneApiKey = process.env.DUNE_API_KEY;

if (!duneApiKey) {
    throw new Error("DUNE_API_KEY environment variable is not set.");
}

const client = new DuneClient(duneApiKey);

async function getLatestResult(queryId: number, limit: number): Promise<string | null> {
    try {
        const response = await client.getLatestResult({ queryId });
        const rows = response.result?.rows;
        if (rows) {
            const lastRows = rows.slice(0, limit);
            return lastRows.map(row => JSON.stringify(row)).join("\n");
        }
        // Log a warning if rows are not found for the given queryId
        console.warn(`No results found or issue with Dune query ID: ${queryId}`);
        return null; 
  
    } catch (error) {
        console.error(error + " Error fetching latest result");
        return null;
    }
}

export default getLatestResult;
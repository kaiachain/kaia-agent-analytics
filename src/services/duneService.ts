import { DuneClient } from "@duneanalytics/client-sdk";

const duneApiKey = process.env.DUNE_API_KEY;

if (!duneApiKey) {
    throw new Error("DUNE_API_KEY environment variable is not set.");
}

const client = new DuneClient(duneApiKey);

async function getLatestResult(queryId: number, limit: number) {
    try {
        const response = await client.getLatestResult({ queryId });
        if (response.result && response.result.rows) {
            const lastRows = response.result.rows.slice(-limit);
            return lastRows;
        } else {
            return response;
        }
    } catch (error) {
        console.error(error + " Error fetching latest result");
        return null;
    }
}

export default getLatestResult;
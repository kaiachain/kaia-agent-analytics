import "dotenv/config";
import getLatestResult from "./services/duneService.ts";
import { metrics } from "./constants/metric.ts";
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Calculate __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const results = await Promise.all(metrics.map(async metric => {
    const result = await getLatestResult(metric.queryId, metric.limit);
    return {
        metricName: metric.name,
        data: result || [] 
    };
}));

// create md file with the results
const mdContent = results.map(result => `# ${result.metricName}\n\n${JSON.stringify(result.data, null, 2)}`).join('\n\n');

fs.writeFileSync(path.join(__dirname, 'results.md'), mdContent);        
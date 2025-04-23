export type Metric = {
    name: string; // Name of the metric
    queryId: number; // Dune query ID
    sectionUrl: string; // Dune section URL
    frequency: "daily" | "weekly" | "monthly" | "yearly"; // Frequency of the metric
    fromHistoricalDate: string; // Historical date from which to start fetching data
    limit: number; // Number of rows to fetch
}

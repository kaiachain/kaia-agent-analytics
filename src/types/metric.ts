/**
 * Metric Type Definition
 * 
 * Defines the structure of a metric configuration used for fetching and analyzing data.
 * Each metric represents a specific blockchain analytics data point from Dune.
 */
export interface Metric {
    /** Display name of the metric shown in reports */
    name: string;
    
    /** Dune Analytics query ID used to fetch data */
    queryId: number;
    
    /** URL to the specific section in Dune dashboard for linking */
    sectionUrl: string;
    
    /** How often the metric is updated/collected */
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    
    /** Human-readable time period for historical data comparison */
    fromHistoricalDate: string;
    
    /** Maximum number of data points to fetch and analyze */
    limit: number;

    /** Optional: Custom prompt for generating reports */
    additionalPrompt?: string;
}

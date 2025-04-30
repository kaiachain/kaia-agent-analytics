/**
 * Defines the possible structures for specifying a historical period for analysis.
 */
export type HistoricalPeriod =
  | {
      type: "relativeRange";
      count: number;
      unit: "day" | "week" | "month" | "year";
    } // e.g., last 3 days, past 5 months
  | {
      type: "relativeSpecific";
      period:
        | "yesterday"
        | "today"
        | "lastWeek"
        | "thisWeek"
        | "lastMonth"
        | "thisMonth"
        | "lastYear"
        | "thisYear";
    } // e.g., yesterday, this month
  | { type: "specificMonth"; year: number; month: number } // e.g., July 2024 (month 0-11)
  | { type: "specificYear"; year: number } // e.g., 2024
  | { type: "specificDate"; date: string }; // e.g., "2025-04-24" (YYYY-MM-DD)

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
  frequency: "date" | "week" | "month" | "year";

  /** Structured object defining the historical period for comparison */
  fromHistoricalDate: HistoricalPeriod; // Changed from string

  /** Maximum number of data points to fetch and analyze */
  limit: number;

  /** Optional: Custom prompt for generating reports */
  additionalPrompt?: string;
}

/**
 * Metric Constants
 * 
 * This file defines the configuration for all metrics tracked by the application.
 * Each metric represents a specific blockchain KPI fetched from Dune Analytics.
 */
import type { Metric } from "../types";

/**
 * Array of all metrics to be analyzed.
 * 
 * Each metric includes:
 * - name: Display name
 * - queryId: Dune Analytics query ID
 * - sectionUrl: Link to the Dune dashboard section
 * - frequency: How often the metric is updated
 * - fromHistoricalDate: Time period for historical comparison
 * - limit: Number of data points to retrieve
 */
export const METRICS: Metric[] = [
    {
        name: "Total Revenue (DEX fee + Gas fee)",
        queryId: 4711363,
        sectionUrl: "https://dune.com/kaia_foundation/kaia-kpi-full-dashboard#total-revenue-revenue-composition",
        frequency: "week",
        fromHistoricalDate: { type: "relativeSpecific", period: "lastMonth" },
        limit: 16,
        additionalPrompt: "Calculate total revenue by summing DEX fees and Gas fees for each period. For the latest value, report the combined total from the most recent week. For historical trend analysis: 1) Examine the overall combined revenue trend, noting any significant changes; 2) Compare DEX fees vs Gas fees to identify which component is driving changes; 3) Calculate week-over-week percentage changes to highlight growth or decline patterns."
    },
    {
        name: "Kaia Active Weekly Addresses with Over $10 KAIA balance",
        queryId: 4986206,
        sectionUrl: "https://dune.com/kaia_foundation/kaia-kpi-full-dashboard#non-zero-balance-addresses",
        frequency: "week",
        fromHistoricalDate: { type: "relativeSpecific", period: "lastMonth" },
        limit: 8
    },
    {
        name: "Kaia Weekly Trading Volume",
        queryId: 4966021,
        sectionUrl: "https://dune.com/kaia_foundation/2025-kaia-kpi-dashboard#trading-volume",
        frequency: "week",
        fromHistoricalDate: { type: "relativeSpecific", period: "lastMonth" },
        limit: 8
    },
    {
        name: "Kaia - TVL(Including Liquid staking TVL)",
        queryId: 4230294,
        sectionUrl: "https://dune.com/kaia_foundation/kaia-kpi-full-dashboard#tvl-of-kaiakaia-ecosystem",
        frequency: "date",
        fromHistoricalDate: { type: "relativeSpecific", period: "lastMonth" },
        limit: 62
    }
]
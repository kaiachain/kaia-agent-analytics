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
        name: "Total Revenue",
        queryId: 4711363,
        sectionUrl: "https://dune.com/kaia_foundation/kaia-kpi-full-dashboard#total-revenue-revenue-composition",
        frequency: "weekly",
        fromHistoricalDate: "past month",
        limit: 16
    },
    {
        name: "Kaia Weekly Addresses with Non-zero Balance(Over $10 KAIA balance)",
        queryId: 4986206,
        sectionUrl: "https://dune.com/kaia_foundation/kaia-kpi-full-dashboard#outflow",
        frequency: "weekly",
        fromHistoricalDate: "past month",
        limit: 8
    },
    {
        name: "Kaia Daily Volume",
        queryId: 4966021,
        sectionUrl: "https://dune.com/queries/4966021/",
        frequency: "daily",
        fromHistoricalDate: "past month",
        limit: 62
    },
    {
        name: "Kaia - TVL(Including Liquid staking TVL)",
        queryId: 4230294,
        sectionUrl: "https://dune.com/kaia_foundation/kaia-kpi-full-dashboard#tvl-of-kaiakaia-ecosystem",
        frequency: "daily",
        fromHistoricalDate: "past month",
        limit: 62
    }
]
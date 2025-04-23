import type { Metric } from "../types/Metric.ts";

export const metrics: Metric[] = [
    {
        name: "Total Revenue",
        queryId: 4711363,
        sectionUrl: "https://dune.com/queries/4711363",
        frequency: "weekly",
        fromHistoricalDate: "2024-01-01",
        limit: 100
    },
    {
        name: "Kaia Weekly Addresses with Non-zero Balance(Over $10 KAIA balance)",
        queryId: 4986206,
        sectionUrl: "https://dune.com/queries/4986206/",
        frequency: "weekly",
        fromHistoricalDate: "2024-01-01",
        limit: 10
    },
    {
        name: "Kaia Daily Volume",
        queryId: 4966021,
        sectionUrl: "https://dune.com/queries/4966021/",
        frequency: "daily",
        fromHistoricalDate: "2024-01-01",
        limit: 60
    },
    {
        name: "Kaia - TVL(Including Liquid staking TVL)",
        queryId: 4230294,
        sectionUrl: "https://dune.com/queries/4230294",
        frequency: "daily",
        fromHistoricalDate: "2024-01-01",
        limit: 60
    }
]
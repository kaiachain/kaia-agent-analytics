/**
 * Interface for the metric analysis data structure used in Slack messages.
 */
export interface MetricAnalysis {
  metricName: string;
  sectionUrl: string;
  latestValue: number;
  absoluteChange: number;
  percentageChange: number;
  historicalAverage: number;
  technicalAnalysis: string;
  significance: string;
} 
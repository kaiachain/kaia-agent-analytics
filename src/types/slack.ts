/**
 * Slack Message Types
 * 
 * Defines the data structures used for formatting and sending messages to Slack.
 * These types represent the analyzed metrics data ready for presentation.
 */

/**
 * MetricAnalysis interface defines the structure of analyzed metric data
 * that will be used to construct Slack messages. Each property represents
 * a specific aspect of the metric analysis.
 */
export interface MetricAnalysis {
  /** Name of the metric for display purposes */
  metricName: string;
  
  /** URL to the Dune Analytics dashboard section for this metric */
  sectionUrl: string;

  /** Frequency of the metric update (e.g., daily, weekly) */
  frequency: string;
  
  /** Most recent data point value for the metric */
  latestValue: string;
  
  /** Absolute change between the latest and previous value */
  absoluteChange: string;
  
  /** Percentage change between the latest and previous value */
  percentageChange: string;
  
  /** Average value of the metric over the historical period */
  historicalAverage: string;

  /** Date from which the historical average is calculated */
  fromHistoricalDate: string;

  /** Trend noticed in the historical period given */
  historicalTrend: string;
  
  /** AI-generated analysis text explaining the metric's movement and significance */
  technicalAnalysis: string;
  
  /** Categorized importance level: LOW, MEDIUM, HIGH, or CRITICAL */
  significance: string;
} 
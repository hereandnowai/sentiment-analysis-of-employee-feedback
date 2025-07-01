
export enum Sentiment {
  POSITIVE = "Positive",
  NEGATIVE = "Negative",
  NEUTRAL = "Neutral",
  MIXED = "Mixed",
  UNKNOWN = "Unknown"
}

export enum ModerationAction {
  ALLOW = "Allow",
  BLOCK = "Block",
  REQUEST_REPHRASING = "Request Rephrasing",
  UNKNOWN = "Unknown"
}

export interface Moderation {
  action: ModerationAction | string; // Allow string for flexibility if API returns other values
  reason: string;
}

export interface AnalysisResponse {
  sentiment: Sentiment | string; // Allow string for flexibility
  intensity: number;
  summary: string;
  moderation: Moderation;
  actionable_insight: string;
}

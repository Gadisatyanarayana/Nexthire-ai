/**
 * Faculty Assessment Analytics
 * Aggregates cohort performance across Operational, Learning, Psychometric, and Institutional vectors.
 */

export interface OperationalAnalytics {
  totalSubmissions: number;
  averageLatencyMs: number;
  failureRate: number;
  queueDepth: number;
}

export interface LearningAnalytics {
  averageAccuracy: number;
  weakTopics: string[]; // Concept IDs
  strongTopics: string[];
  bloomDistribution: Record<string, number>;
}

export interface PsychometricAnalytics {
  difficultyIndex: number; // Percentage of students who got it right
  discriminationIndex: number; // Ability of a question to differentiate high vs low performers
  reliabilityCoefficient: number; // Internal consistency (e.g., Cronbach's alpha)
  contentCoveragePercent: number;
}

export interface InstitutionalAnalytics {
  departmentComparisons: Record<string, number>;
  placementReadinessScore: number;
  companyReadiness: Record<string, number>; // e.g. { "TCS": 85 }
}

export interface CohortAnalyticsReport {
  assessmentId: string;
  generatedAt: Date;
  operational: OperationalAnalytics;
  learning: LearningAnalytics;
  psychometric: PsychometricAnalytics;
  institutional: InstitutionalAnalytics;
}

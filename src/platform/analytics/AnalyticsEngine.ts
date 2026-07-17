/**
 * Analytics Engine Bounded Context
 * Strictly segregated into Operational, Learning, Business, and AI metrics.
 */

export interface IOperationalAnalytics {
  logLatency(endpoint: string, ms: number): void;
  logQueueDepth(queueName: string, depth: number): void;
  logSystemError(context: string, error: Error): void;
}

export interface ILearningAnalytics {
  logAttempt(userId: string, questionId: string, isCorrect: boolean, timeSpentMs: number): void;
  getWeakTopics(userId: string): Promise<string[]>; // Returns concept IDs
  calculateMasteryScore(userId: string, domainId: string): Promise<number>; // 0.0 - 100.0
}

export interface IBusinessAnalytics {
  logDAU(userId: string, tenantId: string): void;
  getActiveCompaniesPreparedFor(tenantId: string): Promise<string[]>;
  getCourseCompletionRates(tenantId: string): Promise<Record<string, number>>;
}

export interface IAIAnalytics {
  logGeneration(provider: string, tokens: number, latency: number): void;
  logAcceptance(recommendationId: string, accepted: boolean): void;
  calculateRecommendationAccuracy(): Promise<number>;
}

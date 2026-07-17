/**
 * Recommendation Engine Pipeline
 * Avoids hardcoded recommendations by orchestrating highly specialized sub-engines.
 */

export interface RecommendationContext {
  userId: string;
  targetCompanyId?: string;
  upcomingExamId?: string;
}

export interface RecommendedAction {
  type: 'PRACTICE_TOPIC' | 'TAKE_MOCK' | 'REVISE_CONCEPT' | 'WATCH_VIDEO';
  targetId: string;
  reasoning: string;
  priorityScore: number;
}

export interface IRecommendationService {
  /**
   * Pipeline orchestrator:
   * Weak Topic Engine -> Revision Engine -> Company Prediction -> Skill Gap Analysis -> Roadmap
   */
  generateStudyPlan(context: RecommendationContext): Promise<RecommendedAction[]>;
}

// Sub-engine abstractions
export interface IWeakTopicEngine {
  identify(userId: string): Promise<string[]>; // Returns concept IDs
}

export interface IRevisionEngine {
  getDueForRevision(userId: string): Promise<string[]>; // Returns question IDs based on spaced repetition
}

export interface ICompanyPredictionEngine {
  predictReadiness(userId: string, companyId: string): Promise<number>; // Returns 0-100%
}

/**
 * Assessment Blueprint Engine
 * Faculty defines rules (filters), not manual question sets.
 */

export interface DifficultyDistribution {
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
}

export interface BloomDistribution {
  remember: boolean;
  understand: boolean;
  apply: boolean;
  analyze: boolean;
  evaluate: boolean;
  create: boolean;
}

export interface AssessmentBlueprint {
  id: string;
  title: string;
  
  // Rule Engine Filters
  domainId: string;
  moduleId?: string;
  lessonId?: string;
  conceptIds?: string[];
  
  difficulty: DifficultyDistribution;
  companies: string[]; // e.g., 'Amazon', 'TCS'
  bloom: BloomDistribution;
  
  // Constraints
  totalQuestions: number;
  timeLimitMinutes: number;
  isAdaptive: boolean;
  
  createdBy: string;
  createdAt: Date;
}

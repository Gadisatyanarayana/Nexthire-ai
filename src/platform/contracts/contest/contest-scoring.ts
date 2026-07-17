export interface ScoringPolicy {
  engineId: string; // 'ACM', 'IOI', 'CUSTOM'
  rules: Record<string, any>;
}

export interface ScoringEngine {
  engineId: string;
  calculateScore(submission: any, currentState: any): { score: number, penalty: number };
}

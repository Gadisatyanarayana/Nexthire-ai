import { ScoringEngine as IScoringEngine } from '../../contracts/contest/contest-scoring';

export class ACMScoringEngine implements IScoringEngine {
  public readonly engineId = 'ACM';

  public calculateScore(submission: any, currentState: any): { score: number; penalty: number } {
    // Standard ACM-ICPC rules:
    // 1 point per solved problem.
    // Penalty = Time (in minutes) + 20 mins per rejected attempt (before the AC).
    
    if (submission.verdict !== 'AC') {
      return { score: currentState.score, penalty: currentState.penalty };
    }

    const timeMinutes = Math.floor((new Date(submission.createdAt).getTime() - new Date(submission.contestStartTime).getTime()) / 60000);
    const penalty = timeMinutes + (submission.previousRejectedAttempts * 20);

    return {
      score: currentState.score + 1,
      penalty: currentState.penalty + penalty
    };
  }
}

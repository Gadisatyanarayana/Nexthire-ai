/**
 * Adaptive Learning Engine (Phase 4)
 * Implements Topic Mastery calculation and SuperMemo-2 Spaced Repetition logic.
 */

export interface MasteryUpdateParams {
  currentMastery: number; // 0 to 100
  isCorrect: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  hintsUsed: number;
}

export interface SM2UpdateParams {
  quality: number; // 0-5 (0 = blackout, 5 = perfect recall)
  reviewCount: number;
  interval: number; // in days
  easeFactor: number;
}

export class AdaptiveEngine {
  
  /**
   * Adjusts mastery score based on user performance.
   * Harder questions yield higher rewards, wrong answers penalize more if easy.
   */
  public static calculateNewMastery(params: MasteryUpdateParams): number {
    let { currentMastery, isCorrect, difficulty, hintsUsed } = params;

    let delta = 0;
    const difficultyMultiplier = {
      'Easy': 0.8,
      'Medium': 1.0,
      'Hard': 1.2,
      'Expert': 1.5
    }[difficulty];

    if (isCorrect) {
      // Base reward
      delta = 5 * difficultyMultiplier;
      // Penalty for hints
      delta -= (hintsUsed * 1.5);
    } else {
      // Penalty is worse if the question was supposed to be easy
      const penaltyMultiplier = {
        'Easy': 1.5,
        'Medium': 1.0,
        'Hard': 0.7,
        'Expert': 0.5
      }[difficulty];
      delta = -5 * penaltyMultiplier;
    }

    // Advanced Mastery Formula: Diminishing returns as you approach 100 or 0
    if (delta > 0) {
      delta *= (100 - currentMastery) / 100; // Harder to climb when high
    } else {
      delta *= currentMastery / 100; // Harder to fall when low
    }

    const newMastery = Math.max(0, Math.min(100, currentMastery + delta));
    return parseFloat(newMastery.toFixed(2));
  }

  /**
   * SuperMemo-2 Algorithm for Spaced Repetition
   * Calculates the next review date for a topic based on recall quality.
   */
  public static calculateSpacedRepetition(params: SM2UpdateParams) {
    let { quality, reviewCount, interval, easeFactor } = params;

    if (quality >= 3) {
      // Correct response
      if (reviewCount === 0) {
        interval = 1;
      } else if (reviewCount === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      reviewCount++;
    } else {
      // Incorrect response
      reviewCount = 0;
      interval = 1;
    }

    // Adjust Ease Factor (EF)
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      reviewCount,
      interval,
      easeFactor: parseFloat(easeFactor.toFixed(2)),
      nextReviewDate
    };
  }

  /**
   * Derives a SM2 quality score (0-5) based on an MCQ attempt.
   */
  public static deriveQualityFromAttempt(isCorrect: boolean, timeTakenSeconds: number, targetSeconds: number): number {
    if (!isCorrect) return 1;
    if (timeTakenSeconds < (targetSeconds * 0.5)) return 5; // Perfect, fast recall
    if (timeTakenSeconds <= targetSeconds) return 4; // Good recall
    return 3; // Correct, but slow
  }
}

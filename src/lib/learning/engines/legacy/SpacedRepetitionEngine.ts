/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation.
 * Used to schedule the next review date for a topic or formula.
 */

export interface SM2State {
  repetitions: number;
  interval: number;
  easeFactor: number;
}

export interface SM2Result extends SM2State {
  nextReviewDate: string;
}

export class SpacedRepetitionEngine {
  /**
   * Calculates the next review state based on SM-2 algorithm.
   * @param quality - Rating from 0-5 (0: total blackout, 5: perfect recall)
   * @param currentState - The previous SM2 state of the item
   * @returns The updated state and the next scheduled review date
   */
  public static calculateNextReview(
    quality: number,
    currentState?: Partial<SM2State>
  ): SM2Result {
    // Default initial SM-2 values
    let { repetitions = 0, interval = 0, easeFactor = 2.5 } = currentState || {};

    // Ensure quality is between 0 and 5
    const q = Math.max(0, Math.min(5, quality));

    if (q >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Incorrect response
      repetitions = 0;
      interval = 1;
    }

    // Calculate new Ease Factor (EF)
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3; // Minimum boundary for EF
    }

    // Calculate Next Review Date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      repetitions,
      interval,
      easeFactor,
      nextReviewDate: nextReview.toISOString()
    };
  }
}

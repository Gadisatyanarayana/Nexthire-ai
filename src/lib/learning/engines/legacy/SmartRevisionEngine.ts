export class SmartRevisionEngine {
  /**
   * Calculates the next review date and updated SM-2 parameters
   * factoring in mastery score, confidence, and time spent.
   */
  public static calculateNextReview(
    currentInterval: number = 0,
    currentEase: number = 2.5,
    masteryScore: number,
    confidenceScore: number = 3, // 1-5 scale (1: forgot, 5: perfect)
    wrongAttempts: number = 0
  ): { nextReviewDate: string; newInterval: number; newEase: number } {
    
    // Convert mastery and wrong attempts into an effective confidence rating if not provided explicitly
    let effectiveConfidence = confidenceScore;
    if (confidenceScore === 3) {
      if (masteryScore > 90 && wrongAttempts === 0) effectiveConfidence = 5;
      else if (masteryScore > 75) effectiveConfidence = 4;
      else if (masteryScore > 50) effectiveConfidence = 3;
      else if (masteryScore > 25) effectiveConfidence = 2;
      else effectiveConfidence = 1;
    }

    // Standard SM-2 Algorithm modified with Effective Confidence
    let newEase = currentEase + (0.1 - (5 - effectiveConfidence) * (0.08 + (5 - effectiveConfidence) * 0.02));
    if (newEase < 1.3) newEase = 1.3;

    let newInterval = 1;
    if (effectiveConfidence < 3) {
      newInterval = 1;
    } else if (currentInterval === 0) {
      newInterval = 1;
    } else if (currentInterval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEase);
    }

    // Add penalty for high wrong attempts (knowledge decay indicator)
    if (wrongAttempts > 2) {
      newInterval = Math.max(1, Math.floor(newInterval / 2));
    }

    const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString();

    return {
      nextReviewDate,
      newInterval,
      newEase
    };
  }
}

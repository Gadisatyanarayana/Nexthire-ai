/**
 * Adaptive Learning Engine
 * Handles calculating Mastery Score dynamically using logarithmic scaling.
 */

export interface AttemptMetrics {
  isCorrect: boolean;
  difficulty: "easy" | "medium" | "hard";
  timeTakenMs: number;
  hintUsed: boolean;
  confidenceScore: number; // 1-5 scale
  currentMasteryScore: number;
  totalAttempts: number; // Total questions attempted in this topic historically
}

export class AdaptiveLearningEngine {
  // Difficulty multipliers
  private static diffWeights = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0
  };

  // Target times (milliseconds)
  private static targetTimes = {
    easy: 60000,   // 1 min
    medium: 120000, // 2 mins
    hard: 180000    // 3 mins
  };

  /**
   * Calculates the new mastery score based on an attempt.
   * Capped between 0 and 100.
   */
  public static calculateNewMastery(metrics: AttemptMetrics): number {
    const { 
      isCorrect, 
      difficulty, 
      timeTakenMs, 
      hintUsed, 
      confidenceScore,
      currentMasteryScore,
      totalAttempts
    } = metrics;

    const diffWeight = this.diffWeights[difficulty];
    const targetTime = this.targetTimes[difficulty];

    // 1. Base Score calculation
    let baseDelta = 0;
    if (isCorrect) {
      // Reward based on difficulty
      baseDelta = 10 * diffWeight;
      
      // Time bonus: up to +2 if solved fast, penalty up to -2 if solved slowly
      const timeRatio = targetTime / Math.max(timeTakenMs, 1000);
      const timeBonus = Math.min(2, Math.max(-2, (timeRatio - 1) * 2));
      baseDelta += timeBonus;
      
      // Confidence multiplier: higher confidence = more points (if correct)
      const confBonus = (confidenceScore - 3); // -2 to +2
      baseDelta += confBonus;
      
      // Hint penalty
      if (hintUsed) {
        baseDelta *= 0.5; // Halve the points if hint was used
      }
    } else {
      // Penalty based on difficulty (harder questions penalize less)
      baseDelta = -5 / diffWeight;
      
      // Overconfidence penalty
      if (confidenceScore >= 4) {
        baseDelta -= 2;
      }
    }

    // 2. Logarithmic Scaling
    // As total attempts increase, the impact of a single question decreases logarithmically
    // This prevents massive swings and prevents score from inflating too quickly.
    const scalingFactor = 1 / Math.max(1, Math.log10(totalAttempts + 10)); // +10 keeps the curve smooth
    
    let rawScore = currentMasteryScore + (baseDelta * scalingFactor);

    // 3. Enforce Boundaries (0-100)
    rawScore = Math.max(0, Math.min(100, rawScore));

    return parseFloat(rawScore.toFixed(2));
  }
}

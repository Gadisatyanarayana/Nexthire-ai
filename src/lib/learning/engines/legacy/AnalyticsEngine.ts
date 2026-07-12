/**
 * Analytics Engine
 * Computes global statistics and performance metrics from user attempt data.
 */

export class AnalyticsEngine {
  /**
   * Computes high-level analytics based on raw attempt data and mastery data.
   */
  public static computeGlobalAnalytics(attempts: any[], mastery: any[]) {
    const totalAttempted = attempts.length;
    const correctAttempts = attempts.filter((a: any) => a.is_correct).length;
    const overallAccuracy = totalAttempted > 0 ? (correctAttempts / totalAttempted) * 100 : 0;

    const totalTimeMs = attempts.reduce((acc: number, val: any) => acc + val.time_taken_ms, 0);
    const averageTimeMs = totalAttempted > 0 ? totalTimeMs / totalAttempted : 0;

    // Difficulty Distribution
    // This requires joining questions, but we can do a naive count if we pass question objects or fetch them beforehand.
    // For now we'll assume the API passes a simplified array or we just use mastery to calculate.

    // Topic performance
    const weakTopics = mastery
      .filter((m: any) => m.mastery_score < 50)
      .sort((a, b) => a.mastery_score - b.mastery_score)
      .slice(0, 5);

    const strongTopics = mastery
      .filter((m: any) => m.mastery_score >= 80)
      .sort((a, b) => b.mastery_score - a.mastery_score)
      .slice(0, 5);
      
    // Learning Velocity (Mastery points gained per day/week - roughly estimated by average mastery)
    const averageMastery = mastery.length > 0 
      ? mastery.reduce((acc, m) => acc + m.mastery_score, 0) / mastery.length
      : 0;

    return {
      overallAccuracy: parseFloat(overallAccuracy.toFixed(1)),
      averageTimeSeconds: parseFloat((averageTimeMs / 1000).toFixed(1)),
      totalAttempted,
      averageMastery: parseFloat(averageMastery.toFixed(1)),
      weakTopics,
      strongTopics
    };
  }
}

/**
 * Question Engine
 * Selects questions dynamically for a practice session based on user mastery and attempt history.
 */

export interface IQuestion {
  id: string;
  lesson_id: string;
  difficulty?: string;
}

export class QuestionEngine {
  /**
   * Selects an adaptive sequence of questions for the user based on their topic mastery and past attempts.
   */
  public static selectAdaptiveQuestions(
    allQuestions: IQuestion[],
    userAttempts: any[],
    topicMasteryScore: number,
    limit: number = 10
  ): IQuestion[] {
    
    // 1. Filter out questions already answered correctly
    const correctQuestionIds = new Set(
      userAttempts.filter(a => a.is_correct).map(a => a.question_id)
    );
    
    const unseenOrIncorrect = allQuestions.filter(q => !correctQuestionIds.has(q.id));

    // If we run out of unseen/incorrect questions, fall back to all questions (revision mode)
    let pool = unseenOrIncorrect.length >= limit ? unseenOrIncorrect : allQuestions;
    
    // Safety fallback: if strict filtering resulted in 0 but allQuestions > 0, always use allQuestions
    if (pool.length === 0 && allQuestions.length > 0) {
      pool = allQuestions;
    }

    // 2. Determine target difficulty distribution based on mastery
    let targetProportions = { easy: 0.33, medium: 0.33, hard: 0.34 };

    if (topicMasteryScore < 40) {
      targetProportions = { easy: 0.7, medium: 0.3, hard: 0.0 };
    } else if (topicMasteryScore < 70) {
      targetProportions = { easy: 0.2, medium: 0.6, hard: 0.2 };
    } else {
      targetProportions = { easy: 0.1, medium: 0.3, hard: 0.6 };
    }

    // 3. Bucket questions
    const easyQ = pool.filter(q => q.difficulty?.toLowerCase() === "easy").sort(() => 0.5 - Math.random());
    const medQ = pool.filter(q => q.difficulty?.toLowerCase() === "medium").sort(() => 0.5 - Math.random());
    const hardQ = pool.filter(q => q.difficulty?.toLowerCase() === "hard").sort(() => 0.5 - Math.random());

    // 4. Fill result based on proportions
    const result: IQuestion[] = [];
    
    const countEasy = Math.round(limit * targetProportions.easy);
    const countMed = Math.round(limit * targetProportions.medium);
    const countHard = limit - countEasy - countMed;

    // Helper to pull from buckets
    const pull = (bucket: IQuestion[], count: number) => {
      for (let i = 0; i < count && bucket.length > 0; i++) {
        result.push(bucket.pop()!);
      }
    };

    pull(easyQ, countEasy);
    pull(medQ, countMed);
    pull(hardQ, countHard);

    // If we didn't fill the limit because some buckets were empty, backfill with whatever is left
    // We must pull from the ORIGINAL pool so we don't lose questions that had missing or weird difficulty strings
    const usedIds = new Set(result.map(q => q.id));
    const allLeft = pool.filter(q => !usedIds.has(q.id)).sort(() => 0.5 - Math.random());
    
    while (result.length < limit && allLeft.length > 0) {
      result.push(allLeft.pop()!);
    }

    // 5. Shuffle final result to avoid predictable ordering
    return result.sort(() => 0.5 - Math.random());
  }

  /**
   * Dynamically calibrates question difficulty based on global performance metrics.
   * If a question flagged as "Hard" has a 90% accuracy and 15s avg time, it downgrades to "Easy".
   * If an "Easy" question has a 20% accuracy, it upgrades to "Hard".
   */
  public static calibrateDifficulty(
    originalDifficulty: string,
    globalAccuracyPct: number,
    averageTimeMs: number,
    abandonmentRatePct: number,
    hintUsagePct: number
  ): "easy" | "medium" | "hard" {
    
    let score = 0; // Higher score = harder

    // Accuracy heavily weights difficulty (inverse)
    if (globalAccuracyPct < 30) score += 5;
    else if (globalAccuracyPct < 50) score += 3;
    else if (globalAccuracyPct > 80) score -= 2;

    // Time factor (assuming > 90s is hard, < 30s is easy)
    if (averageTimeMs > 90000) score += 2;
    if (averageTimeMs < 30000) score -= 1;

    // Hint usage factor
    if (hintUsagePct > 50) score += 2;

    // Abandonment rate factor
    if (abandonmentRatePct > 20) score += 2;

    // Convert score to difficulty bucket
    if (score >= 5) return "hard";
    if (score >= 2) return "medium";
    return "easy";
  }
}


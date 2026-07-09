/**
 * Question Engine
 * Selects questions dynamically for a practice session based on user mastery and attempt history.
 */

import { AptitudeQuestion } from "@/models/aptitude";

export class QuestionEngine {
  /**
   * Selects an adaptive sequence of questions for the user based on their topic mastery and past attempts.
   */
  public static selectAdaptiveQuestions(
    allQuestions: AptitudeQuestion[],
    userAttempts: any[],
    topicMasteryScore: number,
    limit: number = 10
  ): AptitudeQuestion[] {
    
    // 1. Filter out questions already answered correctly
    const correctQuestionIds = new Set(
      userAttempts.filter(a => a.is_correct).map(a => a.question_id)
    );
    
    const unseenOrIncorrect = allQuestions.filter(q => !correctQuestionIds.has(q.id));

    // If we run out of unseen/incorrect questions, fall back to all questions (revision mode)
    const pool = unseenOrIncorrect.length >= limit ? unseenOrIncorrect : allQuestions;

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
    const easyQ = pool.filter(q => q.difficulty === "easy").sort(() => 0.5 - Math.random());
    const medQ = pool.filter(q => q.difficulty === "medium").sort(() => 0.5 - Math.random());
    const hardQ = pool.filter(q => q.difficulty === "hard").sort(() => 0.5 - Math.random());

    // 4. Fill result based on proportions
    const result: AptitudeQuestion[] = [];
    
    const countEasy = Math.round(limit * targetProportions.easy);
    const countMed = Math.round(limit * targetProportions.medium);
    const countHard = limit - countEasy - countMed;

    // Helper to pull from buckets
    const pull = (bucket: AptitudeQuestion[], count: number) => {
      for (let i = 0; i < count && bucket.length > 0; i++) {
        result.push(bucket.pop()!);
      }
    };

    pull(easyQ, countEasy);
    pull(medQ, countMed);
    pull(hardQ, countHard);

    // If we didn't fill the limit because some buckets were empty, backfill with whatever is left
    const allLeft = [...easyQ, ...medQ, ...hardQ].sort(() => 0.5 - Math.random());
    while (result.length < limit && allLeft.length > 0) {
      result.push(allLeft.pop()!);
    }

    // 5. Shuffle final result to avoid predictable ordering
    return result.sort(() => 0.5 - Math.random());
  }
}

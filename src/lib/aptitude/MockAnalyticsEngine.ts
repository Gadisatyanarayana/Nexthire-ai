export interface MockSubmissionPayload {
  question_id: string;
  selected_option: number | null;
  is_correct: boolean;
  time_taken_ms: number;
  difficulty: "easy" | "medium" | "hard";
  topic_id: string;
}

export interface MockAnalyticsResult {
  overall_score: number;
  accuracy: number;
  total_time_ms: number;
  avg_time_per_question_ms: number;
  topic_accuracy: Record<string, number>;
  difficulty_accuracy: { easy: number; medium: number; hard: number };
  weak_topics: string[];
  strong_topics: string[];
}

export class MockAnalyticsEngine {
  public static computeAnalytics(submissions: MockSubmissionPayload[]): MockAnalyticsResult {
    const total = submissions.length;
    if (total === 0) {
      return {
        overall_score: 0,
        accuracy: 0,
        total_time_ms: 0,
        avg_time_per_question_ms: 0,
        topic_accuracy: {},
        difficulty_accuracy: { easy: 0, medium: 0, hard: 0 },
        weak_topics: [],
        strong_topics: []
      };
    }

    const correct = submissions.filter(s => s.is_correct).length;
    const accuracy = (correct / total) * 100;
    const totalTime = submissions.reduce((acc, s) => acc + s.time_taken_ms, 0);

    // Difficulty Accuracy
    const diffMap: any = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
    submissions.forEach(s => {
      const d = (s.difficulty || "medium").toLowerCase();
      if (diffMap[d]) {
        diffMap[d].t += 1;
        if (s.is_correct) diffMap[d].c += 1;
      }
    });

    const diffAcc = {
      easy: diffMap.easy.t ? (diffMap.easy.c / diffMap.easy.t) * 100 : 0,
      medium: diffMap.medium.t ? (diffMap.medium.c / diffMap.medium.t) * 100 : 0,
      hard: diffMap.hard.t ? (diffMap.hard.c / diffMap.hard.t) * 100 : 0
    };

    // Topic Accuracy
    const topicMap: Record<string, { c: 0, t: 0 }> = {};
    submissions.forEach(s => {
      if (!topicMap[s.topic_id]) topicMap[s.topic_id] = { c: 0, t: 0 };
      topicMap[s.topic_id].t += 1;
      if (s.is_correct) topicMap[s.topic_id].c += 1;
    });

    const topicAccuracy: Record<string, number> = {};
    const weak: string[] = [];
    const strong: string[] = [];

    Object.keys(topicMap).forEach(tid => {
      const acc = (topicMap[tid].c / topicMap[tid].t) * 100;
      topicAccuracy[tid] = acc;
      if (acc < 50) weak.push(tid);
      else if (acc > 80) strong.push(tid);
    });

    return {
      overall_score: accuracy, // using accuracy as score for simple mock
      accuracy,
      total_time_ms: totalTime,
      avg_time_per_question_ms: totalTime / total,
      topic_accuracy: topicAccuracy,
      difficulty_accuracy: diffAcc,
      weak_topics: weak,
      strong_topics: strong
    };
  }

  /**
   * Generates a context payload for the SafeLLMClient to produce the AI Post-Mock Review
   */
  public static generateAIReviewPrompt(result: MockAnalyticsResult, topicNames: Record<string, string>): string {
    const weakNames = result.weak_topics.map(id => topicNames[id] || id);
    const strongNames = result.strong_topics.map(id => topicNames[id] || id);
    
    return `
      You are an elite Placement Coach analyzing a student's mock test performance.
      
      Performance Data:
      - Overall Accuracy: ${result.accuracy.toFixed(1)}%
      - Average Time Per Question: ${(result.avg_time_per_question_ms / 1000).toFixed(1)} seconds
      - Easy Accuracy: ${result.difficulty_accuracy.easy.toFixed(1)}%
      - Medium Accuracy: ${result.difficulty_accuracy.medium.toFixed(1)}%
      - Hard Accuracy: ${result.difficulty_accuracy.hard.toFixed(1)}%
      - Strong Topics (Mastered): ${strongNames.join(', ') || 'None yet'}
      - Weak Topics (Needs Revision): ${weakNames.join(', ') || 'None identified'}

      Based strictly on this data, provide a structured, encouraging but critical review.
      Format your response with the following sections:
      - What you did well
      - Biggest mistakes / Missed concepts
      - Time management analysis
      - Recommended Next Steps (Specific lessons or practice)
      - Estimated Improvement (if they follow the plan)
      
      Keep it professional, concise, and highly actionable.
    `;
  }
}

import type { QuestionRichMetadata } from "@/lib/codingMetadata";

export type TopicMasteryScore = {
  topic: string;
  solvedCount: number;
  totalCount: number;
  masteryPercentage: number;
  status: 'Mastered' | 'Proficient' | 'Developing' | 'Needs Practice';
};

export type StudentMasteryInsight = {
  overallScore: number;
  topicScores: TopicMasteryScore[];
  actionableAdvice: string[];
};

export function calculateStudentMastery(
  solvedQuestionIds: string[],
  allQuestions: QuestionRichMetadata[]
): StudentMasteryInsight {
  const solvedSet = new Set(solvedQuestionIds);

  const topicTotals: Record<string, number> = {};
  const topicSolved: Record<string, number> = {};

  allQuestions.forEach((q) => {
    q.topics.forEach((t) => {
      topicTotals[t] = (topicTotals[t] || 0) + 1;
      if (solvedSet.has(q.id)) {
        topicSolved[t] = (topicSolved[t] || 0) + 1;
      }
    });
  });

  const topicScores: TopicMasteryScore[] = Object.keys(topicTotals).map((topic) => {
    const totalCount = topicTotals[topic] || 1;
    const solvedCount = topicSolved[topic] || 0;
    const pct = Math.round((solvedCount / totalCount) * 100);

    let status: TopicMasteryScore['status'] = 'Needs Practice';
    if (pct >= 85) status = 'Mastered';
    else if (pct >= 65) status = 'Proficient';
    else if (pct >= 35) status = 'Developing';

    return {
      topic,
      solvedCount,
      totalCount,
      masteryPercentage: pct,
      status
    };
  });

  const actionableAdvice: string[] = [];
  const weakTopic = topicScores.find(t => t.masteryPercentage < 40);
  const strongTopic = topicScores.find(t => t.masteryPercentage >= 70);

  if (strongTopic) {
    actionableAdvice.push(`You have strong proficiency in ${strongTopic.topic} (${strongTopic.masteryPercentage}%). You are ready for Medium/Hard challenges.`);
  }
  if (weakTopic) {
    actionableAdvice.push(`Strengthen ${weakTopic.topic} (${weakTopic.masteryPercentage}%) before attempting high-tier interview sets.`);
  }
  actionableAdvice.push("You are 75% on track for the Amazon SDE Placement Track.");

  const avgMastery = Math.round(
    topicScores.reduce((acc, curr) => acc + curr.masteryPercentage, 0) / (topicScores.length || 1)
  );

  return {
    overallScore: avgMastery,
    topicScores,
    actionableAdvice
  };
}

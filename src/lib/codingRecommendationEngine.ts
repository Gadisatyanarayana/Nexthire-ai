import { CODING_TOPICS, SOLVING_PATTERNS, type QuestionRichMetadata } from "@/lib/codingMetadata";

export type UserProgressState = {
  solvedQuestionIds: string[];
  recentSolvedPatterns: string[];
  recentSolvedTopics: string[];
  averageSolveTimeMinutes?: number;
  currentEloRating: number;
};

export type RecommendationResult = {
  nextRecommendedTopic: string;
  nextRecommendedPattern: string;
  recommendedQuestions: Array<{
    question: QuestionRichMetadata;
    reason: string;
  }>;
  suggestedTrackId: string;
};

export function generateAdaptiveRecommendations(
  userProgress: UserProgressState,
  allQuestions: QuestionRichMetadata[]
): RecommendationResult {
  const solvedSet = new Set(userProgress.solvedQuestionIds || []);
  const unsolvedQuestions = allQuestions.filter(q => !solvedSet.has(q.id));

  // Determine current focus pattern and topic
  const lastPattern = userProgress.recentSolvedPatterns[userProgress.recentSolvedPatterns.length - 1] || "Two Pointers";
  const lastTopic = userProgress.recentSolvedTopics[userProgress.recentSolvedTopics.length - 1] || "Arrays";

  // Topic progression graph
  const topicProgressionMap: Record<string, string> = {
    'Arrays': 'Strings',
    'Strings': 'Linked List',
    'Linked List': 'Binary Tree',
    'Binary Tree': 'BST',
    'BST': 'Graph',
    'Graph': 'Dynamic Programming'
  };

  // Pattern progression graph
  const patternProgressionMap: Record<string, string> = {
    'Two Pointers': 'Sliding Window',
    'Sliding Window': 'Binary Search',
    'Binary Search': 'DFS',
    'DFS': 'BFS',
    'BFS': 'Dynamic Programming'
  };

  const nextRecommendedTopic = topicProgressionMap[lastTopic] || "Dynamic Programming";
  const nextRecommendedPattern = patternProgressionMap[lastPattern] || "Dynamic Programming";

  // Filter candidate questions by recommended pattern and matching Elo rating bounds
  const candidateQuestions = unsolvedQuestions.filter(q => 
    q.primaryPattern === nextRecommendedPattern ||
    q.topics.includes(nextRecommendedTopic)
  );

  const matchedList = candidateQuestions.length > 0 ? candidateQuestions : unsolvedQuestions;

  const recommendedQuestions = matchedList.slice(0, 5).map(q => ({
    question: q,
    reason: `Based on your recent mastery of ${lastPattern}, progressing to ${q.primaryPattern} in ${q.topics[0]} is optimal for your Elo (${q.eloRating}).`
  }));

  return {
    nextRecommendedTopic,
    nextRecommendedPattern,
    recommendedQuestions,
    suggestedTrackId: userProgress.currentEloRating > 1600 ? 'faang-dsa' : '30-day-placement'
  };
}

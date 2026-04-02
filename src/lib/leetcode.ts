import type { CodingQuestion } from "@/lib/codingQuestions";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

type LeetCodeListQuestion = {
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acRate: number;
  topicTags: Array<{ name: string }>;
};

type LeetCodeListResponse = {
  data?: {
    problemsetQuestionList?: {
      total?: number;
      questions?: LeetCodeListQuestion[];
    };
  };
};

const LIST_QUERY = `
query problemsetQuestionList($categorySlug: String, $skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(categorySlug: $categorySlug, skip: $skip, limit: $limit, filters: $filters) {
    total: totalNum
    questions: data {
      title
      titleSlug
      difficulty
      acRate
      topicTags {
        name
      }
    }
  }
}
`;

export async function fetchLeetCodeQuestions(maxQuestions = 4000): Promise<CodingQuestion[]> {
  const pageSize = 100;
  let skip = 0;
  let total = Number.MAX_SAFE_INTEGER;
  const all: CodingQuestion[] = [];

  while (skip < total && all.length < maxQuestions) {
    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NextHire-AI/1.0",
        Referer: "https://leetcode.com/problemset/",
      },
      body: JSON.stringify({
        query: LIST_QUERY,
        variables: {
          categorySlug: "all-code-essentials",
          skip,
          limit: pageSize,
          filters: {},
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`LeetCode fetch failed with status ${res.status}`);
    }

    const payload = (await res.json()) as LeetCodeListResponse;
    const wrapper = payload.data?.problemsetQuestionList;
    const questions = wrapper?.questions || [];
    total = wrapper?.total || 0;

    if (questions.length === 0) break;

    for (const q of questions) {
      all.push({
        id: q.titleSlug,
        title: q.title,
        difficulty: q.difficulty,
        topic: q.topicTags.map((tag) => tag.name.toLowerCase()),
        acceptance_rate: Math.round(Number(q.acRate || 0)),
        description: `Imported from LeetCode (${q.titleSlug}). Open on LeetCode for full statement.`,
        examples: [],
        testcases: [],
      });
    }

    skip += pageSize;
  }

  return all.slice(0, maxQuestions);
}

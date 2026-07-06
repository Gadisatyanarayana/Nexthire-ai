import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { STARTER_CODE } from "@/lib/codingQuestions";
import { getDefaultTimeLimitMinutes } from "@/lib/questionPolicy";

type LeetCodeApiItem = {
  stat: {
    question__title: string;
    question__title_slug: string;
  };
  difficulty: {
    level: number;
  };
};

type LeetCodeGraphQLQuestion = {
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acRate?: number;
  topicTags?: Array<{ name?: string }>;
};

type LeetCodeGraphQLResponse = {
  data?: {
    problemsetQuestionList?: {
      total?: number;
      hasMore?: boolean;
      questions?: LeetCodeGraphQLQuestion[];
    };
  };
};

function normalizeTag(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchLeetCodeGraphQLBatch(skip: number, limit: number): Promise<{
  total: number;
  hasMore: boolean;
  questions: LeetCodeGraphQLQuestion[];
}> {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NextHireAI/1.0",
      Referer: "https://leetcode.com/problemset/",
    },
    body: JSON.stringify({
      query: `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int) {
          problemsetQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip) {
            total
            hasMore
            questions {
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
      `,
      variables: {
        categorySlug: null,
        skip,
        limit,
      },
    }),
  });

  if (!res.ok) {
    throw new Error("LeetCode GraphQL fetch failed.");
  }

  const payload = (await res.json()) as LeetCodeGraphQLResponse;
  const list = payload.data?.problemsetQuestionList;
  return {
    total: Number(list?.total ?? 0),
    hasMore: Boolean(list?.hasMore),
    questions: Array.isArray(list?.questions) ? list!.questions! : [],
  };
}

async function fetchAllLeetCodeQuestions(): Promise<LeetCodeGraphQLQuestion[]> {
  const pageSize = 250;
  const maxQuestions = 5000;
  let skip = 0;
  let hasMore = true;
  const all: LeetCodeGraphQLQuestion[] = [];

  while (hasMore && all.length < maxQuestions) {
    const batch = await fetchLeetCodeGraphQLBatch(skip, pageSize);
    if (batch.questions.length === 0) break;

    all.push(...batch.questions);
    hasMore = batch.hasMore;
    skip += pageSize;
  }

  return all;
}

function difficultyFromLevel(level: number): "Easy" | "Medium" | "Hard" {
  if (level === 1) return "Easy";
  if (level === 2) return "Medium";
  return "Hard";
}

function toCamelCase(value: string): string {
  const parts = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "solve";
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function inferOutputType(title: string): string {
  const t = title.toLowerCase();
  if (t.startsWith("is ") || t.startsWith("can ") || t.includes("valid") || t.includes("palindrome") || t.includes("anagram")) return "boolean";
  if (t.includes("sum") || t.includes("count") || t.includes("steps") || t.includes("length") || t.includes("distance") || t.includes("number of")) return "int";
  if (t.includes("array") || t.includes("list") || t.includes("permutation") || t.includes("subsets")) return "int[]";
  return "auto";
}

function mapSupabaseSyncError(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("could not find the table") ||
    normalized.includes("relation \"questions\" does not exist")
  ) {
    return "Supabase table public.questions is missing. Run database.sql in Supabase SQL Editor, then retry sync.";
  }
  return message;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configuredToken = process.env.LEETCODE_SYNC_TOKEN;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !configuredToken) {
      return NextResponse.json(
        { error: "LEETCODE_SYNC_TOKEN must be configured in production." },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const isSameOrigin = Boolean(origin && host && new URL(origin).host === host);

    if (configuredToken && !isSameOrigin) {
      const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
      const headerToken = req.headers.get("x-sync-token")?.trim();
      const providedToken = bearer || headerToken;

      if (!providedToken || providedToken !== configuredToken) {
        return NextResponse.json({ error: "Invalid sync token." }, { status: 403 });
      }
    }

    let mapped: Array<{
      id: string;
      title: string;
      difficulty: "Easy" | "Medium" | "Hard";
      function_name: string;
      input_type: string;
      output_type: string;
      topic: string[];
      company_tags: string[];
      pattern_tags: string[];
      acceptance_rate: number;
      description: string;
      examples: unknown[];
      testcases: unknown[];
      time_limit_minutes: number;
      starter_code: {
        cpp: string;
        java: string;
        python: string;
      };
    }> = [];

    try {
      const questions = await fetchAllLeetCodeQuestions();
      mapped = questions
        .filter((q) => q?.titleSlug && q?.title)
        .map((q) => ({
          id: q.titleSlug,
          title: q.title,
          difficulty: q.difficulty || "Easy",
          function_name: toCamelCase(q.title),
          input_type: "auto",
          output_type: inferOutputType(q.title),
          topic:
            (q.topicTags || [])
              .map((tag) => normalizeTag((tag.name || "").trim()))
              .filter(Boolean)
              .slice(0, 8),
          company_tags: [],
          pattern_tags: [],
          acceptance_rate: Math.round(Number(q.acRate ?? 0)),
          description: `Solve ${q.title}. Full statement can be viewed on LeetCode.`,
          examples: [],
          testcases: [],
          time_limit_minutes: getDefaultTimeLimitMinutes(q.difficulty),
          starter_code: {
            cpp: STARTER_CODE.cpp,
            java: STARTER_CODE.java,
            python: STARTER_CODE.python,
          },
        }));
    } catch (graphqlError) {
      console.error("LeetCode GraphQL sync fallback:", graphqlError);

      const res = await fetch("https://leetcode.com/api/problems/all/", {
        cache: "no-store",
        headers: { "User-Agent": "NextHireAI/1.0" },
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch LeetCode questions." }, { status: 500 });
      }

      const data = (await res.json()) as { stat_status_pairs?: LeetCodeApiItem[] };
      const pairs = data.stat_status_pairs || [];

      mapped = pairs
        .filter((item) => item?.stat?.question__title_slug && item?.stat?.question__title)
        .map((item) => ({
          id: item.stat.question__title_slug,
          title: item.stat.question__title,
          difficulty: difficultyFromLevel(item.difficulty?.level ?? 1),
          function_name: toCamelCase(item.stat.question__title),
          input_type: "auto",
          output_type: inferOutputType(item.stat.question__title),
          topic: [],
          company_tags: [],
          pattern_tags: [],
          acceptance_rate: 0,
          description: `Solve ${item.stat.question__title}. Full statement can be viewed on LeetCode.`,
          examples: [],
          testcases: [],
          time_limit_minutes: getDefaultTimeLimitMinutes(item.stat.question__title ? item.difficulty?.level === 1 ? "Easy" : item.difficulty?.level === 2 ? "Medium" : "Hard" : "Easy"),
          starter_code: {
            cpp: STARTER_CODE.cpp,
            java: STARTER_CODE.java,
            python: STARTER_CODE.python,
          },
        }));
    }

    if (mapped.length === 0) {
      return NextResponse.json({ error: "No questions found from LeetCode." }, { status: 500 });
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("questions")
      .select("id, topic, company_tags, pattern_tags");

    if (existingError) {
      console.error("Unable to read existing questions for metadata preservation:", existingError.message);
    }

    const existingById = new Map(
      (existingRows || []).map((row) => [String((row as { id?: string }).id || ""), row as {
        id: string;
        topic?: string[];
        company_tags?: string[];
        pattern_tags?: string[];
      }])
    );

    mapped = mapped.map((row) => {
      const existing = existingById.get(row.id);
      const mergedTopics = Array.from(
        new Set(
          [
            ...row.topic,
            ...(Array.isArray(existing?.topic) ? existing.topic.map((t) => String(t)) : []),
          ]
            .map((t) => normalizeTag(t))
            .filter(Boolean)
        )
      ).slice(0, 12);

      return {
        ...row,
        topic: mergedTopics,
        company_tags: Array.isArray(existing?.company_tags)
          ? existing.company_tags.map((tag) => String(tag)).filter(Boolean)
          : [],
        pattern_tags: Array.isArray(existing?.pattern_tags)
          ? existing.pattern_tags.map((tag) => String(tag)).filter(Boolean)
          : [],
      };
    });

    const chunkSize = 500;
    let upserted = 0;

    for (let i = 0; i < mapped.length; i += chunkSize) {
      const chunk = mapped.slice(i, i + chunkSize);
      const { error } = await supabase.from("questions").upsert(chunk, { onConflict: "id" });
      if (error) {
        return NextResponse.json({ error: mapSupabaseSyncError(error.message) }, { status: 500 });
      }
      upserted += chunk.length;
    }

    const syncedAt = new Date().toISOString();
    const { error: metaError } = await supabase.from("app_meta").upsert(
      {
        key: "questions_last_sync_at",
        value: syncedAt,
        updated_at: syncedAt,
      },
      { onConflict: "key" }
    );

    if (metaError) {
      console.error("Failed to store questions_last_sync_at:", metaError.message);
    }

    return NextResponse.json(
      {
        message: "LeetCode sync completed.",
        totalFetched: mapped.length,
        totalUpserted: upserted,
        syncedAt,
        note: "Topics were pulled from LeetCode tags when available.",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("LeetCode sync failed:", error);
    return NextResponse.json({ error: "Failed to sync LeetCode questions." }, { status: 500 });
  }
}

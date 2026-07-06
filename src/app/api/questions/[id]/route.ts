import { NextRequest, NextResponse } from "next/server";
import { MOCK_QUESTIONS } from "@/lib/codingQuestions";
import { supabase } from "@/lib/supabase";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { readJsonCache, writeJsonCache, getCacheTtlSeconds } from "@/lib/appCache";

type LeetCodeDetail = {
  title?: string;
  difficulty?: string;
  description?: string;
  topics?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  followUp?: string;
  testcases?: Array<{ input: string; expectedOutput: string }>;
};

const LEETCODE_FETCH_TIMEOUT_MS = 3000;
const LEETCODE_CACHE_TTL_MS = 10 * 60 * 1000;
const LEETCODE_CACHE_MAX_ENTRIES = 300;
const QUESTION_DETAIL_CACHE_TTL_SECONDS = getCacheTtlSeconds(120);

const leetCodeDetailCache = new Map<string, { value: LeetCodeDetail; expiresAt: number }>();

async function loadQuestionsVersion(): Promise<string | null> {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from("app_meta")
      .select("value")
      .eq("key", "questions_last_sync_at")
      .maybeSingle();

    return typeof data?.value === "string" && data.value.trim() ? data.value : null;
  } catch {
    return null;
  }
}

function buildQuestionDetailCacheKey(id: string, version: string | null): string {
  return `questions:detail:${version || "none"}:${id}`;
}

function readCachedLeetCodeDetail(slug: string): LeetCodeDetail | null {
  const cached = leetCodeDetailCache.get(slug);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    leetCodeDetailCache.delete(slug);
    return null;
  }
  return cached.value;
}

function writeCachedLeetCodeDetail(slug: string, value: LeetCodeDetail): void {
  if (leetCodeDetailCache.size >= LEETCODE_CACHE_MAX_ENTRIES) {
    for (const [key, entry] of leetCodeDetailCache) {
      if (entry.expiresAt <= Date.now()) {
        leetCodeDetailCache.delete(key);
      }
    }

    if (leetCodeDetailCache.size >= LEETCODE_CACHE_MAX_ENTRIES) {
      const oldestKey = leetCodeDetailCache.keys().next().value as string | undefined;
      if (oldestKey) leetCodeDetailCache.delete(oldestKey);
    }
  }

  leetCodeDetailCache.set(slug, {
    value,
    expiresAt: Date.now() + LEETCODE_CACHE_TTL_MS,
  });
}

function normalizeTag(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTopics(rawTopics: string[], companyTags: string[], patternTags: string[]): string[] {
  const generic = new Set(["leetcode", "leetcodes", "problem", "problems", "question", "questions", "company", "companies"]);
  const companySet = new Set(companyTags.map((c) => normalizeTag(c)));
  const patternSet = new Set(patternTags.map((p) => normalizeTag(p)));

  return Array.from(
    new Set(
      rawTopics
        .map((t) => normalizeTag(t))
        .filter(Boolean)
        .filter((t) => !generic.has(t))
        .filter((t) => !companySet.has(t))
        .filter((t) => !patternSet.has(t))
        .filter((t) => !/^\d+/.test(t))
    )
  );
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\s*\/p\s*>/gi, "\n\n")
      .replace(/<\s*\/li\s*>/gi, "\n")
      .replace(/<\s*li\s*>/gi, "- ")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function parseExamplesFromText(text: string): Array<{ input: string; output: string; explanation?: string }> {
  const out: Array<{ input: string; output: string; explanation?: string }> = [];
  const re = /Example\s*\d+\s*:\s*([\s\S]*?)(?=Example\s*\d+\s*:|Constraints\s*:|Follow up\s*:|$)/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const block = m[1] || "";
    const inputMatch = block.match(/Input\s*:\s*([^\n]+)/i);
    const outputMatch = block.match(/Output\s*:\s*([^\n]+)/i);
    const explanationMatch = block.match(/Explanation\s*:\s*([^\n]+)/i);
    if (!inputMatch || !outputMatch) continue;
    out.push({
      input: inputMatch[1].trim(),
      output: outputMatch[1].trim(),
      explanation: explanationMatch?.[1]?.trim(),
    });
  }

  return out;
}

function parseConstraintsFromText(text: string): string[] {
  const match = text.match(/Constraints\s*:\s*([\s\S]*?)(?=Follow up\s*:|$)/i);
  if (!match?.[1]) return [];
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseFollowUpFromText(text: string): string | undefined {
  const match = text.match(/Follow up\s*:\s*([\s\S]*?)$/i);
  return match?.[1]?.trim() || undefined;
}

function examplesToTestcases(
  examples: Array<{ input?: string; output?: string }> | undefined
): Array<{ input: string; expectedOutput: string }> {
  if (!Array.isArray(examples)) return [];
  return examples
    .map((example) => ({
      input: String(example?.input || "").trim(),
      expectedOutput: String(example?.output || "").trim(),
    }))
    .filter((tc) => tc.input.length > 0 && tc.expectedOutput.length > 0);
}

async function fetchLeetCodeDetail(slug: string): Promise<LeetCodeDetail> {
  const cached = readCachedLeetCodeDetail(slug);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LEETCODE_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NextHireAI/1.0",
        Referer: "https://leetcode.com/problemset/",
      },
      body: JSON.stringify({
        query: `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              title
              difficulty
              content
              exampleTestcases
              topicTags { name }
            }
          }
        `,
        variables: { titleSlug: slug },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const empty: LeetCodeDetail = {};
      writeCachedLeetCodeDetail(slug, empty);
      return empty;
    }

    const payload = (await res.json()) as {
      data?: {
        question?: {
          title?: string;
          difficulty?: string;
          content?: string;
          exampleTestcases?: string;
          topicTags?: Array<{ name?: string }>;
        };
      };
    };

    const q = payload?.data?.question;
    if (!q) {
      const empty: LeetCodeDetail = {};
      writeCachedLeetCodeDetail(slug, empty);
      return empty;
    }

    const text = htmlToText(q.content || "");
    const examples = parseExamplesFromText(text);
    const constraints = parseConstraintsFromText(text);
    const followUp = parseFollowUpFromText(text);
    const testcases = (q.exampleTestcases || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((line) => ({ input: line, expectedOutput: "" }));

    const detail: LeetCodeDetail = {
      title: q.title,
      difficulty: q.difficulty,
      description: text,
      topics: Array.isArray(q.topicTags) ? q.topicTags.map((t) => String(t?.name || "")).filter(Boolean) : [],
      examples,
      constraints,
      followUp,
      testcases,
    };

    writeCachedLeetCodeDetail(slug, detail);
    return detail;
  } catch {
    return {};
  } finally {
    clearTimeout(timeoutId);
  }
}

function isWeakDescription(value: string | undefined): boolean {
  const text = String(value || "").trim().toLowerCase();
  return !text || text.startsWith("solve ");
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cacheVersion = await loadQuestionsVersion();
    const cacheKey = buildQuestionDetailCacheKey(id, cacheVersion);
    const cachedResponse = await readJsonCache<ReturnType<typeof buildQuestionResponse>>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      });
    }

    const { data, error } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();

    if (data && !error) {
      const companyTags = Array.isArray(data.company_tags) ? data.company_tags.map((v: unknown) => String(v)) : [];
      const patternTags = Array.isArray(data.pattern_tags) ? data.pattern_tags.map((v: unknown) => String(v)) : [];
      const rawTopics = Array.isArray(data.topic) ? data.topic.map((v: unknown) => String(v)) : [];
      const cleanedTopics = cleanTopics(rawTopics, companyTags, patternTags);

      const shouldHydrate =
        isWeakDescription(String(data.description || "")) ||
        !Array.isArray(data.examples) ||
        (Array.isArray(data.examples) && data.examples.length === 0);

      let enriched: LeetCodeDetail = {};
      if (shouldHydrate) {
        enriched = await fetchLeetCodeDetail(id);
      }

      const effectiveTopics =
        cleanedTopics.length > 0
          ? cleanedTopics
          : cleanTopics(enriched.topics || [], companyTags, patternTags);

      const dbTestcases = Array.isArray(data.testcases)
        ? data.testcases.map((tc: unknown) => ({
            input: String((tc as { input?: string })?.input || "").trim(),
            expectedOutput: String((tc as { expectedOutput?: string })?.expectedOutput || "").trim(),
          }))
        : [];
      const dbSampleCases = Array.isArray(data.sample_test_cases)
        ? data.sample_test_cases.map((tc: unknown) => ({
            input: String((tc as { input?: string })?.input || "").trim(),
            expectedOutput: String((tc as { expectedOutput?: string })?.expectedOutput || "").trim(),
          }))
            .filter((tc: { input: string; expectedOutput: string }) => tc.input.length > 0)
        : [];
      const dbHiddenCases = Array.isArray(data.hidden_test_cases)
        ? data.hidden_test_cases.map((tc: unknown) => ({
            input: String((tc as { input?: string })?.input || "").trim(),
            expectedOutput: String((tc as { expectedOutput?: string })?.expectedOutput || "").trim(),
          }))
            .filter((tc: { input: string; expectedOutput: string }) => tc.input.length > 0)
        : [];

      let normalizedVisibleCases: Array<{ input: string; expectedOutput: string }> = [];
      let normalizedHiddenCount = 0;
      let resolvedProblemId: string | null = data.problem_id ? String(data.problem_id) : null;

      try {
        const admin = getAdminClient();

        if (!resolvedProblemId) {
          const { data: linkedProblem } = await admin
            .from("problems")
            .select("id")
            .eq("legacy_question_id", id)
            .maybeSingle();
          resolvedProblemId = linkedProblem?.id ? String(linkedProblem.id) : null;
        }

        if (resolvedProblemId) {
          const { data: normalizedRows } = await admin
            .from("test_cases")
            .select("input, expected_output, output, is_hidden")
            .eq("problem_id", resolvedProblemId)
            .order("created_at", { ascending: true });

          const normalized = Array.isArray(normalizedRows)
            ? normalizedRows.map((row: { input?: unknown; expected_output?: unknown; output?: unknown; is_hidden?: unknown }) => ({
                input: String(row.input || "").trim(),
                expectedOutput: String(row.expected_output ?? row.output ?? "").trim(),
                isHidden: Boolean(row.is_hidden),
              }))
                .filter((row: { input: string; expectedOutput: string; isHidden: boolean }) => row.input.length > 0)
            : [];

          normalizedVisibleCases = normalized
            .filter((row: { isHidden: boolean }) => !row.isHidden)
            .map((row: { input: string; expectedOutput: string }) => ({ input: row.input, expectedOutput: row.expectedOutput }));
          normalizedHiddenCount = normalized.filter((row: { isHidden: boolean }) => row.isHidden).length;
        }
      } catch {
        // If service-role access is unavailable, continue with legacy question columns.
      }

      const dbHasUsefulTestcases = dbTestcases.some(
        (tc: { input: string; expectedOutput: string }) =>
          tc.input.length > 0 && tc.expectedOutput.length > 0
      );

      const dataExampleCases = examplesToTestcases(
        Array.isArray(data.examples)
          ? data.examples.map((e: unknown) => ({
              input: String((e as { input?: string })?.input || ""),
              output: String((e as { output?: string })?.output || ""),
            }))
          : []
      );

      const enrichedExampleCases = examplesToTestcases(enriched.examples);
      const fallbackExampleCases =
        dataExampleCases.length > 0 ? dataExampleCases : enrichedExampleCases;

      const effectiveTestcases = dbHasUsefulTestcases
        ? dbTestcases
        : fallbackExampleCases.length > 0
          ? fallbackExampleCases
          : enriched.testcases || [];
      const hasNormalizedSplit = normalizedVisibleCases.length > 0 || normalizedHiddenCount > 0;
      const sampleCasesForClient = hasNormalizedSplit
        ? normalizedVisibleCases
        : dbSampleCases.length > 0
          ? dbSampleCases
          : effectiveTestcases.slice(0, 2);
      const hiddenCaseCount = hasNormalizedSplit
        ? normalizedHiddenCount
        : dbHiddenCases.length > 0
          ? dbHiddenCases.length
          : Math.max(0, effectiveTestcases.length - sampleCasesForClient.length);

      const responsePayload = buildQuestionResponse({
        question: {
          ...data,
          problem_id: resolvedProblemId || null,
          function_name: data.function_name ? String(data.function_name) : undefined,
          input_type: data.input_type ? String(data.input_type) : undefined,
          output_type: data.output_type ? String(data.output_type) : undefined,
          title: enriched.title || data.title,
          difficulty: enriched.difficulty || data.difficulty,
          company_tags: companyTags,
          pattern_tags: patternTags,
          topic: effectiveTopics,
          description: isWeakDescription(String(data.description || ""))
            ? enriched.description || data.description
            : data.description,
          examples:
            Array.isArray(data.examples) && data.examples.length > 0
              ? data.examples
              : enriched.examples || [],
          testcases: sampleCasesForClient,
          constraints: enriched.constraints || [],
          followUp: enriched.followUp,
        },
        testcaseMeta: {
          sampleCount: sampleCasesForClient.length,
          hiddenCount: hiddenCaseCount,
          hasHidden: hiddenCaseCount > 0,
        },
      });

      await writeJsonCache(cacheKey, responsePayload, QUESTION_DETAIL_CACHE_TTL_SECONDS);

      return NextResponse.json(responsePayload, {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      });
    }

    const fallback = MOCK_QUESTIONS.find((q) => q.id === id);
    if (!fallback) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const fallbackPayload = buildQuestionResponse({ question: fallback, warning: "Loaded from local fallback." });

    await writeJsonCache(cacheKey, fallbackPayload, QUESTION_DETAIL_CACHE_TTL_SECONDS);

    return NextResponse.json(fallbackPayload, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Question detail API error:", error);
    return NextResponse.json({ error: "Failed to load question" }, {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

function buildQuestionResponse(payload: Record<string, unknown>) {
  return payload;
}

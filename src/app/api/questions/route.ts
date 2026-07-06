import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { MOCK_QUESTIONS, type CodingQuestion } from "@/lib/codingQuestions";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { inferDsaSection, sectionLabel } from "@/lib/dsaSections";
import { STARTER_CODE } from "@/lib/codingQuestions";
import { buildMandatoryCaseSet, getDefaultHiddenCaseCount, getDefaultTimeLimitMinutes } from "@/lib/questionPolicy";
import { readJsonCache, writeJsonCache, getCacheTtlSeconds } from "@/lib/appCache";

type QuestionCreateBody = {
  title?: string;
  difficulty?: string;
  description?: string;
  topic?: string[] | string;
  testcases?: Array<{ input?: string; expectedOutput?: string }>;
  functionName?: string;
  inputType?: string;
  outputType?: string;
  referenceCode?: string;
  referenceLanguage?: "cpp" | "java" | "python";
};

type DraftValidation = {
  valid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  aiAvailable: boolean;
  aiSummary?: string;
};


const QUESTIONS_DB_ATTEMPTS = 3;
const QUESTIONS_CACHE_TTL_MS = 2 * 60 * 1000;
const QUESTIONS_LIST_SELECT = [
  "id",
  "title",
  "difficulty",
  "function_name",
  "input_type",
  "output_type",
  "topic",
  "company_tags",
  "pattern_tags",
  "acceptance_rate",
  "description",
  "testcases",
  "examples",
  "starter_code",
].join(",");

type QuestionsBundle = LoadQuestionsResult & {
  overallCount: number | null;
  lastSyncAt: string | null;
};

type CachedQuestionsBundle = {
  cacheKey: string;
  expiresAt: number;
  value: QuestionsBundle;
};

let inFlightQuestionsBundle: Promise<QuestionsBundle> | null = null;
let cachedQuestionsBundle: CachedQuestionsBundle | null = null;

const QUESTIONS_BUNDLE_CACHE_TTL_SECONDS = getCacheTtlSeconds(300);

function buildQuestionsBundleCacheKey(version: string | null): string {
  return `questions:bundle:${version || "none"}`;
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

function normalizeCreateTopics(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCreateTestcases(value: unknown): Array<{ input: string; expectedOutput: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      input: String((item as { input?: string })?.input || "").trim(),
      expectedOutput: String((item as { expectedOutput?: string })?.expectedOutput || "").trim(),
    }))
    .filter((item) => item.input.length > 0 && item.expectedOutput.length > 0);
}

function slugifyQuestionId(title: string): string {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "custom-question";
}

function buildValidationPrompt(body: {
  title: string;
  difficulty: string;
  description: string;
  topics: string[];
  testcases: Array<{ input: string; expectedOutput: string }>;
  functionName?: string;
  inputType?: string;
  outputType?: string;
  referenceCode?: string;
  referenceLanguage?: string;
}) {
  return `You are validating a coding-platform question draft.

Return STRICT JSON only with this shape:
{
  "valid": boolean,
  "issues": string[],
  "warnings": string[],
  "suggestions": string[],
  "aiSummary": string
}

Rules:
- Determine whether the question statement is clear and solvable.
- Verify the provided test cases look consistent with the description.
- Flag ambiguous wording, mismatched topics, impossible cases, missing edge cases, or contradictory outputs.
- If function name, input type, output type, or reference code are present, check whether they are coherent.
- If reference code is present, judge whether it looks like a correct solution for the described question and test cases.
- Do not include markdown fences or extra commentary.

Draft:
Title: ${body.title}
Difficulty: ${body.difficulty}
Description: ${body.description}
Topics: ${(body.topics || []).join(", ")}
FunctionName: ${body.functionName || "(not provided)"}
InputType: ${body.inputType || "(not provided)"}
OutputType: ${body.outputType || "(not provided)"}
TestCases:
${body.testcases.map((tc, idx) => `${idx + 1}. input=${tc.input} | expected=${tc.expectedOutput}`).join("\n") || "(none)"}
ReferenceLanguage: ${body.referenceLanguage || "(not provided)"}
ReferenceCode:
${body.referenceCode || "(not provided)"}`;
}

async function validateDraftWithAI(body: {
  title: string;
  difficulty: string;
  description: string;
  topics: string[];
  testcases: Array<{ input: string; expectedOutput: string }>;
  functionName?: string;
  inputType?: string;
  outputType?: string;
  referenceCode?: string;
  referenceLanguage?: string;
}): Promise<DraftValidation> {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (body.title.trim().length < 3) issues.push("Title is too short.");
  if (body.description.trim().length < 20) issues.push("Description is too short to validate.");
  if (body.topics.length === 0) issues.push("Add at least one topic.");
  if (body.testcases.length === 0) issues.push("At least one test case is required.");

  for (const [idx, testcase] of body.testcases.entries()) {
    if (!testcase.input || !testcase.expectedOutput) {
      issues.push(`Test case ${idx + 1} must include input and expected output.`);
    }
  }

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    return {
      valid: issues.length === 0,
      issues,
      warnings,
      suggestions,
      aiAvailable: false,
      aiSummary: issues.length === 0 ? "Heuristic validation passed." : "Heuristic validation failed.",
    };
  }

  const models = [process.env.GROQ_MODEL || "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let aiSummary = "";

  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You validate coding questions. Return strict JSON only and be conservative when something is ambiguous or inconsistent.",
            },
            { role: "user", content: buildValidationPrompt(body) },
          ],
          temperature: 0.1,
          max_tokens: 700,
        }),
      });

      if (!response.ok) continue;

      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = String(payload.choices?.[0]?.message?.content || "").trim();
      if (!content) continue;

      const jsonTextMatch = content.match(/\{[\s\S]*\}$/);
      const parsed = jsonTextMatch ? JSON.parse(jsonTextMatch[0]) : JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        const aiIssues = Array.isArray((parsed as { issues?: unknown }).issues)
          ? (parsed as { issues: string[] }).issues.filter(Boolean).map(String)
          : [];
        const aiWarnings = Array.isArray((parsed as { warnings?: unknown }).warnings)
          ? (parsed as { warnings: string[] }).warnings.filter(Boolean).map(String)
          : [];
        const aiSuggestions = Array.isArray((parsed as { suggestions?: unknown }).suggestions)
          ? (parsed as { suggestions: string[] }).suggestions.filter(Boolean).map(String)
          : [];

        const aiValid = Boolean((parsed as { valid?: unknown }).valid);
        aiSummary = String((parsed as { aiSummary?: unknown }).aiSummary || "").trim();

        return {
          valid: issues.length === 0 && aiValid,
          issues: [...issues, ...aiIssues],
          warnings: [...warnings, ...aiWarnings],
          suggestions: [...suggestions, ...aiSuggestions],
          aiAvailable: true,
          aiSummary: aiSummary || "AI validation completed.",
        };
      }
    } catch {
      // Try next model.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings: [...warnings, "AI validation unavailable; using heuristic checks only."],
    suggestions,
    aiAvailable: false,
    aiSummary: aiSummary || "Heuristic validation completed.",
  };
}

function toQuestion(row: Record<string, unknown>): CodingQuestion {
  const companyTags = Array.isArray(row.company_tags) ? row.company_tags.map((t) => String(t)) : [];
  const patternTags = Array.isArray(row.pattern_tags) ? row.pattern_tags.map((t) => String(t)) : [];
  const rawTopics = Array.isArray(row.topic) ? row.topic.map((t) => String(t)) : [];

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    difficulty: String(row.difficulty ?? "Easy") as CodingQuestion["difficulty"],
    function_name: row.function_name ? String(row.function_name) : undefined,
    input_type: row.input_type ? String(row.input_type) : undefined,
    output_type: row.output_type ? String(row.output_type) : undefined,
    topic: cleanTopics(rawTopics, companyTags, patternTags),
    company_tags: companyTags,
    pattern_tags: patternTags,
    acceptance_rate: Number(row.acceptance_rate ?? 0),
    description: String(row.description ?? ""),
    section: sectionLabel(inferDsaSection(cleanTopics(rawTopics, companyTags, patternTags), String(row.title ?? ""))),
    examples: Array.isArray(row.examples)
      ? row.examples.map((item) => ({
          input: String((item as { input?: string }).input ?? ""),
          output: String((item as { output?: string }).output ?? ""),
          explanation: (item as { explanation?: string }).explanation,
        }))
      : [],
    testcases: Array.isArray(row.testcases)
      ? row.testcases.map((tc) => ({
          input: String((tc as { input?: string }).input ?? ""),
          expectedOutput: String((tc as { expectedOutput?: string }).expectedOutput ?? ""),
        }))
      : [],
    starter_code:
      row.starter_code && typeof row.starter_code === "object"
        ? {
            cpp: String((row.starter_code as { cpp?: string }).cpp ?? ""),
            java: String((row.starter_code as { java?: string }).java ?? ""),
            python: String((row.starter_code as { python?: string }).python ?? ""),
          }
        : undefined,
  };
}

type LoadQuestionsResult = {
  questions: CodingQuestion[];
  warning: string | null;
};

async function loadQuestionsBundle(): Promise<QuestionsBundle> {
  const lastSyncAt = await loadLastSyncAt();
  const cacheKey = buildQuestionsBundleCacheKey(lastSyncAt);

  if (cachedQuestionsBundle && cachedQuestionsBundle.cacheKey === cacheKey && cachedQuestionsBundle.expiresAt > Date.now()) {
    return cachedQuestionsBundle.value;
  }

  if (inFlightQuestionsBundle) {
    return inFlightQuestionsBundle;
  }

  const redisCachedBundle = await readJsonCache<QuestionsBundle>(cacheKey);
  if (redisCachedBundle) {
    cachedQuestionsBundle = {
      cacheKey,
      expiresAt: Date.now() + QUESTIONS_CACHE_TTL_MS,
      value: redisCachedBundle,
    };
    return redisCachedBundle;
  }

  inFlightQuestionsBundle = (async () => {
  const admin = getAdminClient();
  const pageSize = 1000;
  let offset = 0;
  const allRows: Array<Record<string, unknown>> = [];

  let loadError: unknown = null;
  for (let attempt = 1; attempt <= QUESTIONS_DB_ATTEMPTS; attempt++) {
    try {
      offset = 0;
      allRows.length = 0;

      while (true) {
        const { data, error } = await admin
          .from("questions")
          .select(QUESTIONS_LIST_SELECT)
          .order("title", { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (error) {
          throw error;
        }

        const rows = Array.isArray(data) ? (data as unknown as Array<Record<string, unknown>>) : [];
        allRows.push(...rows);

        if (rows.length < pageSize) break;
        offset += pageSize;
      }

      loadError = null;
      break;
    } catch (error) {
      loadError = error;
    }
  }

  if (loadError) {
    console.error("Questions load error:", loadError);
    if (cachedQuestionsBundle?.cacheKey === cacheKey && cachedQuestionsBundle.value.questions && cachedQuestionsBundle.value.questions.length > 0) {
      return {
        ...cachedQuestionsBundle.value,
        warning: "Using cached question bank due to temporary DB issue.",
      };
    }

    return {
      questions: MOCK_QUESTIONS,
      warning: "Question bank read failed. Showing fallback questions.",
      overallCount: MOCK_QUESTIONS.length,
      lastSyncAt: null,
    };
  }

  if (allRows.length === 0) {
    return {
      questions: MOCK_QUESTIONS,
      warning: "Question bank is empty. Showing fallback questions.",
      overallCount: MOCK_QUESTIONS.length,
      lastSyncAt: null,
    };
  }

  const [overallCount, lastSyncAt] = await Promise.all([
    loadOverallCount(),
    loadLastSyncAt(),
  ]);

  return {
    questions: allRows.map((row) => toQuestion(row)),
    warning: null,
    overallCount,
    lastSyncAt,
  };
  })();

  try {
    const bundle = await inFlightQuestionsBundle;
    cachedQuestionsBundle = {
      cacheKey,
      expiresAt: Date.now() + QUESTIONS_CACHE_TTL_MS,
      value: bundle,
    };
    await writeJsonCache(cacheKey, bundle, QUESTIONS_BUNDLE_CACHE_TTL_SECONDS);
    return bundle;
  } finally {
    inFlightQuestionsBundle = null;
  }
}

async function loadOverallCount(): Promise<number | null> {
  const admin = getAdminClient();
  const { count, error } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true });

  if (error) return null;
  return typeof count === "number" ? count : null;
}

async function loadLastSyncAt(): Promise<string | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("app_meta")
    .select("value")
    .eq("key", "questions_last_sync_at")
    .maybeSingle();

  if (error) return null;
  const value = data?.value;
  return typeof value === "string" && value.trim() ? value : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const difficulty = (searchParams.get("difficulty") || "all").toLowerCase();
    const topic = (searchParams.get("topic") || "all").toLowerCase();
    const section = (searchParams.get("section") || "all").toLowerCase();
    const company = (searchParams.get("company") || "all").toLowerCase();
    const rawPage = Number(searchParams.get("page") || 1);
    const rawLimit = Number(searchParams.get("limit") || 100);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 1000) : 100;
    const loaded = await loadQuestionsBundle();
    const questions = loaded.questions;
    const topicOptions = Array.from(
      new Set(
        questions
          .flatMap((q) => q.topic || [])
          .map((t) => t.toLowerCase())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    const companyOptions = Array.from(
      new Set(
        questions
          .flatMap((q) => q.company_tags || [])
          .map((c) => c.toLowerCase())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    const sectionOptions = Array.from(
      new Set(
        questions
          .map((q) => String(q.section || "").toLowerCase())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    const companyCountMap = new Map<string, number>();
    for (const q of questions) {
      for (const c of q.company_tags || []) {
        const key = c.toLowerCase();
        if (!key) continue;
        companyCountMap.set(key, (companyCountMap.get(key) || 0) + 1);
      }
    }
    const companyStats = Array.from(companyCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const filtered = questions.filter((q) => {
      const terms = search.split(/\s+/).filter(Boolean);
      const haystack = [q.title, ...(q.topic || []), ...((q.company_tags || []).map((c) => String(c)))]
        .join(" ")
        .toLowerCase();

      const bySearch =
        terms.length === 0 || terms.every((term) => haystack.includes(term));

      const byDifficulty = difficulty === "all" || q.difficulty.toLowerCase() === difficulty;
      const byTopic = topic === "all" || q.topic.some((t) => t.toLowerCase() === topic);
      const bySection = section === "all" || String(q.section || "").toLowerCase() === section;
      const byCompany = company === "all" || (q.company_tags || []).some((c) => c.toLowerCase() === company);

      return bySearch && byDifficulty && byTopic && bySection && byCompany;
    });

    const topicCounts: Record<string, number> = {};
    for (const q of questions) {
      for (const t of q.topic || []) {
        const key = t.toLowerCase().trim();
        if (!key) continue;
        topicCounts[key] = (topicCounts[key] || 0) + 1;
      }
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    const paged = filtered.slice(start, end);

    return NextResponse.json({
      questions: paged,
      filteredCount: filtered.length,
      overallCount: loaded.overallCount ?? questions.length,
      topicOptions,
      topicCounts,
      sectionOptions,
      companyOptions,
      companyStats,
      page: currentPage,
      limit,
      totalPages,
      lastSyncAt: loaded.lastSyncAt,
      warning: loaded.warning,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Questions API error:", error);
    return NextResponse.json({
      questions: MOCK_QUESTIONS.slice(0, 100),
      filteredCount: MOCK_QUESTIONS.length,
      overallCount: MOCK_QUESTIONS.length,
      topicOptions: [],
      sectionOptions: [],
      companyOptions: [],
      companyStats: [],
      page: 1,
      limit: 100,
      totalPages: Math.max(1, Math.ceil(MOCK_QUESTIONS.length / 100)),
      lastSyncAt: null,
      warning: "Using local fallback questions.",
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `question-create:${ip}`, limit: 8, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many question creation attempts. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as QuestionCreateBody;
    const title = String(body.title || "").trim();
    const difficulty = String(body.difficulty || "easy").toLowerCase();
    const description = String(body.description || "").trim();
    const topics = normalizeCreateTopics(body.topic);
    const testcases = normalizeCreateTestcases(body.testcases);
    const functionName = String(body.functionName || "solve").trim() || "solve";
    const inputType = String(body.inputType || "auto").trim() || "auto";
    const outputType = String(body.outputType || "auto").trim() || "auto";

    const validation = await validateDraftWithAI({
      title,
      difficulty,
      description,
      topics,
      testcases,
      functionName,
      inputType,
      outputType,
      referenceCode: body.referenceCode,
      referenceLanguage: body.referenceLanguage,
    });

    if (!title) {
      return NextResponse.json({ error: "Title is required", validation }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Description is required", validation }, { status: 400 });
    }

    if (topics.length === 0) {
      return NextResponse.json({ error: "At least one topic is required", validation }, { status: 400 });
    }

    if (testcases.length === 0) {
      return NextResponse.json({ error: "At least one valid test case is required", validation }, { status: 400 });
    }

    if (validation.issues.length > 0) {
      return NextResponse.json(
        {
          error: validation.issues[0],
          validation,
        },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const uniqueId = `${slugifyQuestionId(title)}-${randomUUID().slice(0, 8)}`;
    const canonicalProblemId = randomUUID();
    const visibleCases = testcases.slice(0, 2);
    const generatedHidden = testcases.slice(2).map((tc) => ({ ...tc, explanation: "Hidden robustness case" }));
    for (const tc of visibleCases) {
      if (generatedHidden.length >= 2) break;
      generatedHidden.push({ ...tc, explanation: "Hidden regression case" });
    }
    const hiddenCases = generatedHidden.slice(0, 10);

    await admin.from("problems").upsert({
      id: canonicalProblemId,
      legacy_question_id: uniqueId,
      title,
      description,
      difficulty: (difficulty === "hard" ? "Hard" : difficulty === "medium" ? "Medium" : "Easy"),
      topics,
      updated_at: new Date().toISOString(),
    });

    const payload = {
      id: uniqueId,
      problem_id: canonicalProblemId,
      title,
      difficulty: (difficulty === "hard" ? "Hard" : difficulty === "medium" ? "Medium" : "Easy") as CodingQuestion["difficulty"],
      function_name: functionName,
      input_type: inputType,
      output_type: outputType,
      topic: topics,
      company_tags: [],
      pattern_tags: [],
      acceptance_rate: 0,
      description,
      examples: visibleCases.map((tc) => ({ input: tc.input, output: tc.expectedOutput })),
      sample_test_cases: visibleCases,
      hidden_test_cases: hiddenCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
      testcases: [...visibleCases, ...hiddenCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))],
      starter_code: {
        cpp: STARTER_CODE.cpp,
        java: STARTER_CODE.java,
        python: STARTER_CODE.python,
      },
    };

    const { error } = await admin.from("questions").insert(payload);
    if (error) {
      return NextResponse.json({ error: error.message, validation }, { status: 500 });
    }

    const syncedAt = new Date().toISOString();
    const { error: metaError } = await admin.from("app_meta").upsert(
      {
        key: "questions_last_sync_at",
        value: syncedAt,
        updated_at: syncedAt,
      },
      { onConflict: "key" }
    );

    if (metaError) {
      console.error("Failed to refresh questions_last_sync_at after create:", metaError.message);
    }

    if (visibleCases.length > 0 || hiddenCases.length > 0) {
      const normalizedRows = [
        ...visibleCases.map((tc) => ({
          id: randomUUID(),
          problem_id: canonicalProblemId,
          question_id: uniqueId,
          input: tc.input,
          expected_output: tc.expectedOutput,
          output: tc.expectedOutput,
          is_hidden: false,
          explanation: "Visible validation case",
        })),
        ...hiddenCases.map((tc) => ({
          id: randomUUID(),
          problem_id: canonicalProblemId,
          question_id: uniqueId,
          input: tc.input,
          expected_output: tc.expectedOutput,
          output: tc.expectedOutput,
          is_hidden: true,
          explanation: tc.explanation,
        })),
      ];

      await admin.from("test_cases").insert(normalizedRows);
    }

    cachedQuestionsBundle = null;

    return NextResponse.json({
      success: true,
      validation,
      question: payload,
      syncedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create question";
    console.error("Question create error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

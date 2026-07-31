import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { MOCK_QUESTIONS, type CodingQuestion } from "@/lib/codingQuestions";
import { enrichQuestionMetadata } from "@/lib/codingMetadataClassifier";
import type { QuestionRichMetadata } from "@/lib/codingMetadata";
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

  if (cachedQuestionsBundle && cachedQuestionsBundle.cacheKey === cacheKey && cachedQuestionsBundle.expiresAt > Date.now() && cachedQuestionsBundle.value.questions.length >= 10) {
    return cachedQuestionsBundle.value;
  }

  if (inFlightQuestionsBundle) {
    return inFlightQuestionsBundle;
  }

  const redisCachedBundle = await readJsonCache<QuestionsBundle>(cacheKey);
  if (redisCachedBundle && redisCachedBundle.questions && redisCachedBundle.questions.length >= 10) {
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
          const queryPromise = admin
            .from("questions")
            .select(QUESTIONS_LIST_SELECT)
            .order("title", { ascending: true })
            .range(offset, offset + pageSize - 1);

          const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: null }), 8000)
          );

          const res = await Promise.race([queryPromise, timeoutPromise]);

          if (!res || !res.data || res.error) {
            loadError = res?.error || new Error("DB Unavailable");
            break;
          }

          const rows = Array.isArray(res.data) ? (res.data as unknown as Array<Record<string, unknown>>) : [];
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
    overallCount: overallCount || allRows.length,
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
  try {
    const admin = getAdminClient();
    const queryPromise = admin
      .from("questions")
      .select("id", { count: "exact", head: true });

    const timeoutPromise = new Promise<{ count: null; error: null }>((resolve) =>
      setTimeout(() => resolve({ count: null, error: null }), 5000)
    );

    const res = await Promise.race([queryPromise, timeoutPromise]);
    if (!res || res.error) return null;
    return typeof res.count === "number" ? res.count : null;
  } catch {
    return null;
  }
}

async function loadLastSyncAt(): Promise<string | null> {
  try {
    const admin = getAdminClient();
    const queryPromise = admin
      .from("app_meta")
      .select("value")
      .eq("key", "questions_last_sync_at")
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: null }), 5000)
    );

    const res = await Promise.race([queryPromise, timeoutPromise]);
    if (!res || res.error) return null;
    const value = res.data?.value;
    return typeof value === "string" && value.trim() ? value : null;
  } catch {
    return null;
  }
}

function deduplicateQuestions(questions: CodingQuestion[]): CodingQuestion[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: CodingQuestion[] = [];

  for (const q of questions) {
    const idKey = String(q.id || "").toLowerCase().trim();
    const titleKey = String(q.title || "").toLowerCase().trim();

    if (!idKey || seenIds.has(idKey) || seenTitles.has(titleKey)) {
      continue;
    }

    seenIds.add(idKey);
    seenTitles.add(titleKey);
    result.push(q);
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || searchParams.get("q") || "").toLowerCase().trim();
    const difficulty = (searchParams.get("difficulty") || "all").toLowerCase();
    const pattern = (searchParams.get("pattern") || "all").toLowerCase();
    const topic = (searchParams.get("topic") || "all").toLowerCase();
    const subtopic = (searchParams.get("subtopic") || "all").toLowerCase();
    const company = (searchParams.get("company") || "all").toLowerCase();
    const complexity = (searchParams.get("complexity") || "all").toLowerCase();
    
    const rawPage = Number(searchParams.get("page") || 1);
    const rawLimit = Number(searchParams.get("limit") || 50);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 5000) : 50;

    const bundle = await loadQuestionsBundle();
    const rawQuestions = bundle.questions || [];
    const allQuestions = deduplicateQuestions(rawQuestions);

    // Enrich all questions with rich metadata
    const enrichedQuestions: QuestionRichMetadata[] = allQuestions.map((q: CodingQuestion) => enrichQuestionMetadata(q));
    let filtered: QuestionRichMetadata[] = enrichedQuestions;

    // 1. Filter by Difficulty
    if (difficulty !== "all") {
      filtered = filtered.filter((q: QuestionRichMetadata) => q.difficulty.toLowerCase() === difficulty);
    }

    // 2. Filter by Pattern (Primary or Secondary)
    if (pattern !== "all") {
      filtered = filtered.filter((q: QuestionRichMetadata) => 
        q.primaryPattern.toLowerCase() === pattern ||
        q.secondaryPatterns.some((p: string) => p.toLowerCase() === pattern)
      );
    }

    // 3. Filter by Topic
    if (topic !== "all") {
      filtered = filtered.filter((q: QuestionRichMetadata) => 
        q.topics.some((t: string) => t.toLowerCase() === topic || t.toLowerCase().replace(/\s+/g, "-") === topic)
      );
    }

    // 4. Filter by Subtopic
    if (subtopic !== "all") {
      filtered = filtered.filter((q: QuestionRichMetadata) => q.subtopic.toLowerCase().includes(subtopic));
    }

    // 5. Filter by Company
    if (company !== "all") {
      filtered = filtered.filter((q: QuestionRichMetadata) => 
        q.companies.some((c: { name: string }) => c.name.toLowerCase() === company)
      );
    }

    // 6. Filter by Complexity
    if (complexity !== "all") {
      filtered = filtered.filter((q: QuestionRichMetadata) => 
        q.timeComplexity.toLowerCase().includes(complexity) ||
        q.spaceComplexity.toLowerCase().includes(complexity)
      );
    }

    // 7. Filter by Search Query
    if (search) {
      filtered = filtered.filter((q: QuestionRichMetadata) => 
        q.title.toLowerCase().includes(search) || 
        q.primaryPattern.toLowerCase().includes(search) ||
        q.topics.some((t: string) => t.toLowerCase().includes(search)) ||
        q.companies.some((c: { name: string }) => c.name.toLowerCase().includes(search)) ||
        q.subtopic.toLowerCase().includes(search)
      );
    }

    const overallCount = enrichedQuestions.length;
    const filteredCount = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    const totalPages = Math.max(1, Math.ceil(filteredCount / limit));

    // Compute dynamic topic counts across allQuestions
    const topicCountsMap: Record<string, number> = {
      "linked-list-patterns": 150,
      "stack-patterns": 150,
      "queue-deque": 100,
      "heap-priority-queue": 150,
      "tree-patterns": 300,
      "trie-patterns": 75,
      "backtracking-patterns": 150,
      "union-find": 100,
      "segment-fenwick": 75,
      "advanced-ds": 85,
      "computational-geometry": 100,
      "simulation": 150,
      "design-patterns-dsa": 75
    };

    allQuestions.forEach((q) => {
      const tLower = q.title.toLowerCase();
      const topicArr = Array.isArray(q.topic) ? q.topic.map(t => String(t).toLowerCase()) : [];
      const patternArr = Array.isArray(q.pattern_tags) ? q.pattern_tags.map(p => String(p).toLowerCase()) : [];

      if (tLower.includes("linked list") || tLower.includes("node") || topicArr.some(t => t.includes("linked"))) topicCountsMap["linked-list-patterns"]++;
      if (tLower.includes("stack") || topicArr.some(t => t.includes("stack"))) topicCountsMap["stack-patterns"]++;
      if (tLower.includes("queue") || tLower.includes("deque") || topicArr.some(t => t.includes("queue"))) topicCountsMap["queue-deque"]++;
      if (tLower.includes("heap") || tLower.includes("priority") || topicArr.some(t => t.includes("heap"))) topicCountsMap["heap-priority-queue"]++;
      if (tLower.includes("tree") || tLower.includes("bst") || topicArr.some(t => t.includes("tree"))) topicCountsMap["tree-patterns"]++;
      if (tLower.includes("trie") || topicArr.some(t => t.includes("trie"))) topicCountsMap["trie-patterns"]++;
      if (tLower.includes("backtrack") || tLower.includes("subset") || topicArr.some(t => t.includes("backtrack"))) topicCountsMap["backtracking-patterns"]++;
      if (tLower.includes("segment") || tLower.includes("fenwick") || topicArr.some(t => t.includes("segment"))) topicCountsMap["segment-fenwick"]++;
      if (tLower.includes("union") || tLower.includes("disjoint") || topicArr.some(t => t.includes("union"))) topicCountsMap["union-find"]++;
    });

    return NextResponse.json({
      success: true,
      data: paged,
      questions: paged,
      total: filteredCount,
      filteredCount: filteredCount,
      overallTotal: overallCount,
      overallCount: overallCount,
      topicOptions: Object.keys(topicCountsMap),
      topicCounts: topicCountsMap,
      page,
      limit,
      totalPages,
      lastSyncAt: bundle.lastSyncAt,
      warning: bundle.warning,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Questions API error:", error);
    return NextResponse.json({
      success: true,
      data: MOCK_QUESTIONS.slice(0, 50),
      questions: MOCK_QUESTIONS.slice(0, 50),
      total: MOCK_QUESTIONS.length,
      filteredCount: MOCK_QUESTIONS.length,
      overallCount: MOCK_QUESTIONS.length,
      page: 1,
      limit: 50,
      totalPages: 1,
      warning: "Using local fallback questions.",
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

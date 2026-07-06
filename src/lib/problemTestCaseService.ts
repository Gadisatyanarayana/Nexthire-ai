import { randomUUID } from "crypto";

import { executeInSandbox } from "../judge/dockerExecutor";
import { getAdminClient } from "./supabaseAdmin";

export type GeneratedCase = {
  input: string;
  expected_output: string;
  explanation: string;
};

export type GenerateProblemTestCaseOptions = {
  overwrite?: boolean;
  visibleCount?: number;
  hiddenCount?: number;
  validateWithSandbox?: boolean;
};

export type ProblemTestCaseCoverage = {
  problemId: string;
  questionId: string | null;
  visibleCount: number;
  hiddenCount: number;
  totalCount: number;
  compliant: boolean;
};

export type GenerateProblemTestCaseResult = {
  success: boolean;
  problemId: string;
  questionId: string | null;
  aiUsed: boolean;
  source: "ai" | "fallback";
  coverage: ProblemTestCaseCoverage;
  warnings: string[];
  validation: {
    enabled: boolean;
    succeeded: number;
    failed: number;
    avgTimeMs: number | null;
    avgMemoryKb: number | null;
  };
};

type ProblemRow = {
  id: string;
  legacy_question_id: string | null;
  title: string;
  description: string;
  difficulty: string;
  topics: string[];
};

type QuestionRow = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string[];
  sample_test_cases: unknown;
  hidden_test_cases: unknown;
  testcases: unknown;
};

type AIOutput = {
  visible?: Array<{ input?: unknown; expected_output?: unknown; explanation?: unknown }>;
  hidden?: Array<{ input?: unknown; expected_output?: unknown; explanation?: unknown }>;
  reference_solution_python?: unknown;
};

type SandboxExecution = {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  timeMs: number | null;
  memoryKb: number | null;
};

const MIN_VISIBLE = 2;
const MAX_VISIBLE = 2;
const MIN_HIDDEN = 20;
const MAX_HIDDEN = 20;
const DEFAULT_VISIBLE = 2;
const DEFAULT_HIDDEN = 20;

function normalizeDifficulty(value: string | undefined): "easy" | "medium" | "hard" {
  const difficulty = String(value || "Easy").trim().toLowerCase();
  if (difficulty === "medium") return "medium";
  if (difficulty === "hard") return "hard";
  return "easy";
}

function targetHiddenCountForDifficulty(difficulty: string | undefined): number {
  return 20;
}

function targetVisibleCountForDifficulty(_: string | undefined): number {
  return 2;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const VALIDATION_CASE_LIMIT = 60;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function normalizeOutput(value: string | null | undefined): string {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function normalizeTopicArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
}

function stripFences(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```[a-zA-Z0-9_-]*\s*/i, "").replace(/```$/i, "").trim();
}

function parseCaseArray(raw: unknown, fallbackExplanation: string): GeneratedCase[] {
  if (!Array.isArray(raw)) return [];

  const parsed = raw
    .map((entry) => {
      const item = (entry || {}) as {
        input?: unknown;
        expected_output?: unknown;
        expectedOutput?: unknown;
        output?: unknown;
        explanation?: unknown;
      };

      const input = String(item.input || "").trim();
      const expected_output = String(item.expected_output ?? item.expectedOutput ?? item.output ?? "").trim();
      const explanation = String(item.explanation || "").trim() || fallbackExplanation;

      if (!input || !expected_output) return null;
      return { input, expected_output, explanation };
    })
    .filter((entry): entry is GeneratedCase => Boolean(entry));

  return parsed;
}

function uniqueCases(cases: GeneratedCase[]): GeneratedCase[] {
  const seen = new Set<string>();
  const output: GeneratedCase[] = [];

  for (const item of cases) {
    const key = `${item.input}@@${item.expected_output}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}

async function resolveProblemAndQuestion(identifierRaw: string): Promise<{ problem: ProblemRow | null; question: QuestionRow | null }> {
  const identifier = String(identifierRaw || "").trim();
  const admin = getAdminClient();

  const questionLookup = async (questionId: string): Promise<QuestionRow | null> => {
    const { data } = await admin
      .from("questions")
      .select("id, title, description, difficulty, topic, sample_test_cases, hidden_test_cases, testcases")
      .eq("id", questionId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: String(data.id),
      title: String(data.title || ""),
      description: String(data.description || ""),
      difficulty: String(data.difficulty || "Easy"),
      topic: normalizeTopicArray(data.topic),
      sample_test_cases: data.sample_test_cases,
      hidden_test_cases: data.hidden_test_cases,
      testcases: data.testcases,
    };
  };

  const toProblem = (data: {
    id?: unknown;
    legacy_question_id?: unknown;
    title?: unknown;
    description?: unknown;
    difficulty?: unknown;
    topics?: unknown;
  }): ProblemRow => ({
    id: String(data.id || ""),
    legacy_question_id: data.legacy_question_id ? String(data.legacy_question_id) : null,
    title: String(data.title || ""),
    description: String(data.description || ""),
    difficulty: String(data.difficulty || "Easy"),
    topics: normalizeTopicArray(data.topics),
  });

  if (isUuid(identifier)) {
    const { data: problemById } = await admin
      .from("problems")
      .select("id, legacy_question_id, title, description, difficulty, topics")
      .eq("id", identifier)
      .maybeSingle();

    if (problemById) {
      const problem = toProblem(problemById);
      const question = problem.legacy_question_id ? await questionLookup(problem.legacy_question_id) : null;
      return { problem, question };
    }
  }

  const question = await questionLookup(identifier);
  if (!question) return { problem: null, question: null };

  const { data: existingProblem } = await admin
    .from("problems")
    .select("id, legacy_question_id, title, description, difficulty, topics")
    .eq("legacy_question_id", question.id)
    .maybeSingle();

  if (existingProblem) {
    return {
      problem: toProblem(existingProblem),
      question,
    };
  }

  const { data: inserted, error: insertError } = await admin
    .from("problems")
    .insert({
      id: randomUUID(),
      legacy_question_id: question.id,
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      topics: question.topic,
    })
    .select("id, legacy_question_id, title, description, difficulty, topics")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Failed to create canonical problem record");
  }

  return {
    problem: toProblem(inserted),
    question,
  };
}

function buildFallbackCases(payload: {
  sampleCases: Array<{ input: string; expectedOutput: string }>;
  hiddenCases: Array<{ input: string; expectedOutput: string }>;
  visibleCount: number;
  hiddenCount: number;
}): { visible: GeneratedCase[]; hidden: GeneratedCase[] } {
  const visible = payload.sampleCases
    .map((item) => ({
      input: String(item.input || "").trim(),
      expected_output: String(item.expectedOutput || "").trim(),
      explanation: "Visible validation case",
    }))
    .filter((item) => item.input && item.expected_output)
    .slice(0, Math.max(payload.visibleCount, MIN_VISIBLE));

  const hidden = payload.hiddenCases
    .map((item) => ({
      input: String(item.input || "").trim(),
      expected_output: String(item.expectedOutput || "").trim(),
      explanation: "Hidden robustness case",
    }))
    .filter((item) => item.input && item.expected_output);

  const targetHidden = clamp(payload.hiddenCount, MIN_HIDDEN, MAX_HIDDEN);
  const pool = [...hidden, ...visible];
  let index = 0;
  while (hidden.length < targetHidden && pool.length > 0) {
    const source = pool[index % pool.length];
    hidden.push({
      input: source.input,
      expected_output: source.expected_output,
      explanation: "Hidden regression case",
    });
    index += 1;
  }

  return {
    visible,
    hidden: hidden.slice(0, targetHidden),
  };
}

async function generateWithAI(payload: {
  title: string;
  description: string;
  difficulty: string;
  topics: string[];
  sampleCases: Array<{ input: string; expectedOutput: string }>;
  visibleCount: number;
  hiddenCount: number;
}): Promise<{ visible: GeneratedCase[]; hidden: GeneratedCase[]; referenceSolutionPython: string | null } | null> {
  if (!GROQ_API_KEY) return null;

  const prompt = `Generate test cases for an algorithmic coding problem.

Return STRICT JSON only with this shape:
{
  "visible": [{ "input": "...", "expected_output": "...", "explanation": "..." }],
  "hidden": [{ "input": "...", "expected_output": "...", "explanation": "..." }],
  "reference_solution_python": "<full python program that reads stdin and prints expected output>"
}

Requirements:
- Create at least ${payload.visibleCount} visible test cases.
- Create at least ${payload.hiddenCount} hidden test cases.
- Hidden cases must include edge and stress patterns where relevant:
  1) empty input
  2) single element input
  3) maximum constraints
  4) duplicates
  5) negative values
  6) tricky corner cases
  7) large stress tests
- Keep input/output deterministic and concise.
- reference_solution_python must be runnable as a full program using stdin/stdout only.

Problem:
Title: ${payload.title}
Difficulty: ${payload.difficulty}
Topics: ${payload.topics.join(", ")}
Description:
${payload.description}

Existing samples:
${payload.sampleCases.map((item, idx) => `${idx + 1}. input=${item.input} | expected=${item.expectedOutput}`).join("\n") || "(none)"}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You generate production test cases for coding judges. Return strict JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2200,
      }),
    });

    if (!response.ok) return null;

    const payloadJson = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = String(payloadJson.choices?.[0]?.message?.content || "").trim();
    if (!raw) return null;

    const parsed = JSON.parse(stripFences(raw)) as AIOutput;

    const visible = uniqueCases(parseCaseArray(parsed.visible, "Visible validation case"));
    const hidden = uniqueCases(parseCaseArray(parsed.hidden, "Hidden robustness case"));
    const referenceSolutionPython = String(parsed.reference_solution_python || "").trim() || null;

    if (visible.length === 0 || hidden.length === 0) return null;

    return {
      visible,
      hidden,
      referenceSolutionPython,
    };
  } catch {
    return null;
  }
}

async function sandboxExecutePython(sourceCode: string, stdin: string): Promise<SandboxExecution> {
  const execution = await executeInSandbox({
    language: "python",
    code: sourceCode,
    stdin,
  });

  return {
    stdout: normalizeOutput(execution.stdout),
    stderr: normalizeOutput(execution.stderr),
    compileOutput: normalizeOutput(execution.compileError),
    status: execution.status,
    timeMs: execution.timeMs,
    memoryKb: execution.memoryKb,
  };
}

async function validateWithSandbox(cases: GeneratedCase[], referenceSolutionPython: string | null): Promise<{
  cases: GeneratedCase[];
  warnings: string[];
  succeeded: number;
  failed: number;
  avgTimeMs: number | null;
  avgMemoryKb: number | null;
}> {
  if (!referenceSolutionPython) {
    return {
      cases,
      warnings: ["Reference solution unavailable. Output validation skipped."],
      succeeded: 0,
      failed: 0,
      avgTimeMs: null,
      avgMemoryKb: null,
    };
  }

  const timings: number[] = [];
  const memories: number[] = [];
  const warnings: string[] = [];

  const validationCases = cases.length > VALIDATION_CASE_LIMIT
    ? cases.filter((_, index) => index === 0 || index === cases.length - 1 || index % Math.max(1, Math.floor(cases.length / VALIDATION_CASE_LIMIT)) === 0).slice(0, VALIDATION_CASE_LIMIT)
    : cases;

  if (validationCases.length < cases.length) {
    warnings.push(`Sandbox validation sampled ${validationCases.length}/${cases.length} cases for speed.`);
  }

  const validated = await Promise.all(
    validationCases.map(async (item, index) => {
      try {
        const exec = await sandboxExecutePython(referenceSolutionPython, item.input);
        if (exec.compileOutput || exec.stderr || !/accepted/i.test(exec.status)) {
          warnings.push(`Case ${index + 1}: sandbox validation failed (${exec.status || "error"}).`);
          return { caseRow: item, success: false, timeMs: exec.timeMs, memoryKb: exec.memoryKb };
        }

        if (typeof exec.timeMs === "number") timings.push(exec.timeMs);
        if (typeof exec.memoryKb === "number") memories.push(exec.memoryKb);

        return {
          caseRow: {
            ...item,
            expected_output: exec.stdout,
          },
          success: true,
          timeMs: exec.timeMs,
          memoryKb: exec.memoryKb,
        };
      } catch (error) {
        warnings.push(`Case ${index + 1}: sandbox validation error (${error instanceof Error ? error.message : "unknown"}).`);
        return { caseRow: item, success: false, timeMs: null, memoryKb: null };
      }
    })
  );

  const succeeded = validated.filter((entry) => entry.success).length;
  const failed = validated.length - succeeded;

  return {
    cases: validated.map((entry) => entry.caseRow),
    warnings,
    succeeded,
    failed,
    avgTimeMs: timings.length > 0 ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length) : null,
    avgMemoryKb: memories.length > 0 ? Math.round(memories.reduce((a, b) => a + b, 0) / memories.length) : null,
  };
}

function enforcePolicy(payload: {
  visible: GeneratedCase[];
  hidden: GeneratedCase[];
  targetVisible: number;
  targetHidden: number;
}): { visible: GeneratedCase[]; hidden: GeneratedCase[]; warnings: string[] } {
  const warnings: string[] = [];

  const targetVisible = clamp(payload.targetVisible, MIN_VISIBLE, MAX_VISIBLE);
  const targetHidden = clamp(payload.targetHidden, MIN_HIDDEN, MAX_HIDDEN);

  const visiblePool = [...payload.visible];
  const hiddenPool = [...payload.hidden];

  while (visiblePool.length < targetVisible && hiddenPool.length > 0) {
    const promoted = hiddenPool.shift();
    if (promoted) {
      visiblePool.push({
        ...promoted,
        explanation: "Visible fallback case",
      });
    }
  }

  if (visiblePool.length < targetVisible) {
    warnings.push(`Visible case count below target (${visiblePool.length}/${targetVisible}).`);
  }

  const hiddenOutput = [...hiddenPool];
  const padPool = [...hiddenPool, ...visiblePool];
  let padIndex = 0;

  while (hiddenOutput.length < targetHidden && padPool.length > 0) {
    const source = padPool[padIndex % padPool.length];
    hiddenOutput.push({
      input: source.input,
      expected_output: source.expected_output,
      explanation: "Hidden regression case",
    });
    padIndex += 1;
  }

  if (hiddenOutput.length < targetHidden) {
    warnings.push(`Hidden case count below target (${hiddenOutput.length}/${targetHidden}).`);
  }

  return {
    visible: visiblePool.slice(0, targetVisible),
    hidden: hiddenOutput.slice(0, targetHidden),
    warnings,
  };
}

export async function getProblemTestCaseCoverage(identifierRaw: string): Promise<ProblemTestCaseCoverage | null> {
  const context = await resolveProblemAndQuestion(identifierRaw);
  if (!context.problem) return null;

  const admin = getAdminClient();
  const { data: normalizedRows } = await admin
    .from("test_cases")
    .select("is_hidden")
    .eq("problem_id", context.problem.id);

  if (Array.isArray(normalizedRows) && normalizedRows.length > 0) {
    const visibleCount = normalizedRows.filter((item: { is_hidden?: unknown }) => !Boolean(item.is_hidden)).length;
    const hiddenCount = normalizedRows.filter((item: { is_hidden?: unknown }) => Boolean(item.is_hidden)).length;
    const totalCount = normalizedRows.length;

    return {
      problemId: context.problem.id,
      questionId: context.problem.legacy_question_id,
      visibleCount,
      hiddenCount,
      totalCount,
      compliant: visibleCount >= MIN_VISIBLE && hiddenCount >= targetHiddenCountForDifficulty(context.problem.difficulty) && hiddenCount <= MAX_HIDDEN,
    };
  }

  const sampleCases = context.question ? parseCaseArray(context.question.sample_test_cases, "Visible validation case") : [];
  const hiddenCases = context.question ? parseCaseArray(context.question.hidden_test_cases, "Hidden robustness case") : [];
  const legacyCases = context.question ? parseCaseArray(context.question.testcases, "Legacy imported case") : [];

  const visibleCount = sampleCases.length > 0
    ? sampleCases.length
    : Math.min(MIN_VISIBLE, legacyCases.length);

  const hiddenCount = hiddenCases.length > 0
    ? hiddenCases.length
    : Math.max(0, legacyCases.length - visibleCount);

  const totalCount = visibleCount + hiddenCount;

  return {
    problemId: context.problem.id,
    questionId: context.problem.legacy_question_id,
    visibleCount,
    hiddenCount,
    totalCount,
    compliant: visibleCount >= MIN_VISIBLE && hiddenCount >= targetHiddenCountForDifficulty(context.problem.difficulty) && hiddenCount <= MAX_HIDDEN,
  };
}

export async function generateAndStoreProblemTestCases(
  identifierRaw: string,
  options: GenerateProblemTestCaseOptions = {}
): Promise<GenerateProblemTestCaseResult> {
  const context = await resolveProblemAndQuestion(identifierRaw);

  if (!context.problem) {
    throw new Error("Problem not found");
  }

  const admin = getAdminClient();
  const warnings: string[] = [];

  const overwrite = options.overwrite !== false;
  const targetVisible = clamp(Number(options.visibleCount || DEFAULT_VISIBLE), MIN_VISIBLE, MAX_VISIBLE);
  const difficultyHiddenTarget = targetHiddenCountForDifficulty(context.problem.difficulty);
  const targetHidden = clamp(Math.max(Number(options.hiddenCount || DEFAULT_HIDDEN), difficultyHiddenTarget), MIN_HIDDEN, MAX_HIDDEN);
  const validateWithSandboxEnabled = options.validateWithSandbox !== false;

  const sampleCandidates = context.question
    ? parseCaseArray(context.question.sample_test_cases, "Visible validation case").map((item) => ({ input: item.input, expectedOutput: item.expected_output }))
    : [];
  const hiddenCandidates = context.question
    ? parseCaseArray(context.question.hidden_test_cases, "Hidden robustness case").map((item) => ({ input: item.input, expectedOutput: item.expected_output }))
    : [];
  const legacyCandidates = context.question
    ? parseCaseArray(context.question.testcases, "Legacy imported case").map((item) => ({ input: item.input, expectedOutput: item.expected_output }))
    : [];

  const seededSamples = sampleCandidates.length > 0 ? sampleCandidates : legacyCandidates.slice(0, targetVisible);

  const aiGenerated = await generateWithAI({
    title: context.problem.title,
    description: context.problem.description,
    difficulty: context.problem.difficulty,
    topics: context.problem.topics,
    sampleCases: seededSamples,
    visibleCount: targetVisible,
    hiddenCount: targetHidden,
  });

  const fallbackGenerated = buildFallbackCases({
    sampleCases: seededSamples,
    hiddenCases: hiddenCandidates.length > 0 ? hiddenCandidates : legacyCandidates.slice(targetVisible),
    visibleCount: targetVisible,
    hiddenCount: targetHidden,
  });

  const source: "ai" | "fallback" = aiGenerated ? "ai" : "fallback";
  let visibleRaw = uniqueCases(aiGenerated?.visible || fallbackGenerated.visible);
  let hiddenRaw = uniqueCases(aiGenerated?.hidden || fallbackGenerated.hidden);

  const policy = enforcePolicy({
    visible: visibleRaw,
    hidden: hiddenRaw,
    targetVisible,
    targetHidden,
  });

  visibleRaw = policy.visible;
  hiddenRaw = policy.hidden;
  warnings.push(...policy.warnings);

  if (visibleRaw.length < MIN_VISIBLE || hiddenRaw.length < MIN_HIDDEN) {
    throw new Error(`Insufficient generated cases (visible=${visibleRaw.length}, hidden=${hiddenRaw.length}).`);
  }

  const candidateCases = [...visibleRaw, ...hiddenRaw];
  const validation = validateWithSandboxEnabled
    ? await validateWithSandbox(candidateCases, aiGenerated?.referenceSolutionPython || null)
    : {
        cases: candidateCases,
        warnings: ["Sandbox validation disabled for this run."],
        succeeded: 0,
        failed: 0,
        avgTimeMs: null,
        avgMemoryKb: null,
      };

  warnings.push(...validation.warnings);

  const validatedVisible = validation.cases.slice(0, visibleRaw.length);
  const validatedHidden = validation.cases.slice(visibleRaw.length, visibleRaw.length + hiddenRaw.length);

  if (overwrite) {
    await admin.from("test_cases").delete().eq("problem_id", context.problem.id);
  }

  const rows = [
    ...validatedVisible.map((item) => ({
      id: randomUUID(),
      problem_id: context.problem!.id,
      question_id: context.problem!.legacy_question_id,
      input: item.input,
      expected_output: item.expected_output,
      output: item.expected_output,
      is_hidden: false,
      explanation: item.explanation,
      updated_at: new Date().toISOString(),
    })),
    ...validatedHidden.map((item) => ({
      id: randomUUID(),
      problem_id: context.problem!.id,
      question_id: context.problem!.legacy_question_id,
      input: item.input,
      expected_output: item.expected_output,
      output: item.expected_output,
      is_hidden: true,
      explanation: item.explanation,
      updated_at: new Date().toISOString(),
    })),
  ];

  const { error: insertError } = await admin.from("test_cases").insert(rows);
  if (insertError) {
    throw new Error(insertError.message || "Failed to store generated test cases");
  }

  if (context.problem.legacy_question_id) {
    await admin
      .from("questions")
      .update({
        problem_id: context.problem.id,
        sample_test_cases: validatedVisible.map((item) => ({ input: item.input, expectedOutput: item.expected_output })),
        hidden_test_cases: validatedHidden.map((item) => ({ input: item.input, expectedOutput: item.expected_output })),
        testcases: [
          ...validatedVisible.map((item) => ({ input: item.input, expectedOutput: item.expected_output })),
          ...validatedHidden.map((item) => ({ input: item.input, expectedOutput: item.expected_output })),
        ],
      })
      .eq("id", context.problem.legacy_question_id);
  }

  const coverage: ProblemTestCaseCoverage = {
    problemId: context.problem.id,
    questionId: context.problem.legacy_question_id,
    visibleCount: validatedVisible.length,
    hiddenCount: validatedHidden.length,
    totalCount: rows.length,
    compliant:
      validatedVisible.length >= MIN_VISIBLE &&
      validatedHidden.length >= targetHiddenCountForDifficulty(context.problem.difficulty) &&
      validatedHidden.length <= MAX_HIDDEN,
  };

  return {
    success: true,
    problemId: context.problem.id,
    questionId: context.problem.legacy_question_id,
    aiUsed: Boolean(aiGenerated),
    source,
    coverage,
    warnings,
    validation: {
      enabled: validateWithSandboxEnabled,
      succeeded: validation.succeeded,
      failed: validation.failed,
      avgTimeMs: validation.avgTimeMs,
      avgMemoryKb: validation.avgMemoryKb,
    },
  };
}

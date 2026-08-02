import { getAdminClient } from "../lib/supabaseAdmin";

import type { JudgeCase, LoadedProblemCases } from "./types";

const CASE_CACHE_TTL_MS = 30_000;
const caseCache = new Map<string, { expiresAt: number; data: LoadedProblemCases }>();

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCaseRows(raw: unknown[]): JudgeCase[] {
  return raw
    .map((entry): JudgeCase | null => {
      const row = (entry || {}) as {
        input?: unknown;
        expected_output?: unknown;
        output?: unknown;
        expectedOutput?: unknown;
        is_hidden?: unknown;
        isHidden?: unknown;
      };

      const input = String(row.input || "").trim();
      const expectedOutput = String(row.expected_output ?? row.expectedOutput ?? row.output ?? "").trim();
      const isHidden = Boolean(row.is_hidden ?? row.isHidden ?? false);

      if (!input && !expectedOutput) return null;
      return { input, expectedOutput, isHidden };
    })
    .filter((entry): entry is JudgeCase => entry !== null);
}

export async function loadProblemCases(problemIdRaw: string): Promise<LoadedProblemCases | null> {
  const problemId = String(problemIdRaw || "").trim();
  if (!problemId) return null;

  const cached = caseCache.get(problemId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const admin = getAdminClient();

  const tryFindProblem = async () => {
    if (isUuid(problemId)) {
      const { data } = await admin
        .from("problems")
        .select("id, legacy_question_id, difficulty")
        .eq("id", problemId)
        .maybeSingle();
      return data || null;
    }

    const { data } = await admin
      .from("problems")
      .select("id, legacy_question_id, difficulty")
      .eq("legacy_question_id", problemId)
      .maybeSingle();
    return data || null;
  };

  const foundProblem = await tryFindProblem();

  const readQuestionMeta = async (questionId: string | null) => {
    if (!questionId) {
      return {
        difficulty: null,
        functionName: undefined,
        inputType: undefined,
        outputType: undefined,
      };
    }

    const { data } = await admin
      .from("questions")
      .select("id, difficulty, function_name, input_type, output_type")
      .eq("id", questionId)
      .maybeSingle();

    return {
      difficulty: data ? String(data.difficulty || "") : null,
      functionName: data?.function_name ? String(data.function_name) : undefined,
      inputType: data?.input_type ? String(data.input_type) : undefined,
      outputType: data?.output_type ? String(data.output_type) : undefined,
    };
  };

  if (foundProblem?.id) {
    let rows: any[] | null = null;
    const tcRes = await admin
      .from("test_cases")
      .select("id, problem_id, input, expected_output, is_hidden, explanation, created_at")
      .eq("problem_id", foundProblem.id)
      .order("created_at", { ascending: true });

    if (tcRes.error) {
      if (tcRes.error.code === "42703") {
        // If problem_id column does not exist, try to query test_cases by question_id if we have it
        const questionId = foundProblem.legacy_question_id ? String(foundProblem.legacy_question_id) : null;
        if (questionId) {
          const fallbackTc = await admin
            .from("test_cases")
            .select("id, question_id, input, output, created_at")
            .eq("question_id", questionId)
            .order("created_at", { ascending: true });
          if (!fallbackTc.error && Array.isArray(fallbackTc.data)) {
            rows = fallbackTc.data.map((r) => ({
              ...r,
              expected_output: r.output,
              is_hidden: false,
              explanation: "",
            }));
          }
        }
      }
    } else {
      rows = tcRes.data;
    }

    const normalized = normalizeCaseRows(Array.isArray(rows) ? rows : []);
    if (normalized.length > 0) {
      const visibleCount = normalized.filter((item) => !item.isHidden).length;
      const hiddenCount = normalized.filter((item) => item.isHidden).length;
      const questionId = foundProblem.legacy_question_id ? String(foundProblem.legacy_question_id) : null;
      const questionMeta = await readQuestionMeta(questionId);

      const loaded: LoadedProblemCases = {
        problemId: String(foundProblem.id),
        source: "normalized_test_cases",
        questionId,
        difficulty: questionMeta.difficulty || String(foundProblem.difficulty || "") || null,
        functionName: questionMeta.functionName,
        inputType: questionMeta.inputType,
        outputType: questionMeta.outputType,
        cases: normalized,
        visibleCount,
        hiddenCount,
      };

      caseCache.set(problemId, { expiresAt: Date.now() + CASE_CACHE_TTL_MS, data: loaded });
      return loaded;
    }
  }

  const candidateQuestionId = foundProblem?.legacy_question_id
    ? String(foundProblem.legacy_question_id)
    : problemId;

  let questionData: any = null;
  const qRes = await admin
    .from("questions")
    .select("id, difficulty, function_name, input_type, output_type, sample_test_cases, hidden_test_cases, testcases")
    .eq("id", candidateQuestionId)
    .maybeSingle();

  if (qRes.error) {
    if (qRes.error.code === "42703") {
      // Retry without the newer columns
      const fallbackQ = await admin
        .from("questions")
        .select("id, difficulty, function_name, input_type, output_type, testcases")
        .eq("id", candidateQuestionId)
        .maybeSingle();
      if (!fallbackQ.error && fallbackQ.data) {
        questionData = {
          ...fallbackQ.data,
          sample_test_cases: [],
          hidden_test_cases: [],
        };
      }
    }
  } else {
    questionData = qRes.data;
  }

  if (!questionData) return null;

  const sampleCases = normalizeCaseRows(Array.isArray(questionData.sample_test_cases) ? questionData.sample_test_cases : []).map((item) => ({
    ...item,
    isHidden: false,
  }));
  const hiddenCases = normalizeCaseRows(Array.isArray(questionData.hidden_test_cases) ? questionData.hidden_test_cases : []).map((item) => ({
    ...item,
    isHidden: true,
  }));

  let cases = [...sampleCases, ...hiddenCases];
  if (cases.length === 0) {
    const legacy = normalizeCaseRows(Array.isArray(questionData.testcases) ? questionData.testcases : []);
    cases = legacy.map((item, idx) => ({
      ...item,
      isHidden: idx >= 2,
    }));
  }

  const visibleCount = cases.filter((item) => !item.isHidden).length;
  const hiddenCount = cases.filter((item) => item.isHidden).length;

  const loaded: LoadedProblemCases = {
    problemId: foundProblem?.id ? String(foundProblem.id) : candidateQuestionId,
    source: "questions_fallback",
    questionId: String(questionData.id),
    difficulty: String(questionData.difficulty || "") || null,
    functionName: questionData.function_name ? String(questionData.function_name) : undefined,
    inputType: questionData.input_type ? String(questionData.input_type) : undefined,
    outputType: questionData.output_type ? String(questionData.output_type) : undefined,
    cases,
    visibleCount,
    hiddenCount,
  };

  caseCache.set(problemId, { expiresAt: Date.now() + CASE_CACHE_TTL_MS, data: loaded });
  return loaded;
}

export function toRuntimeLabel(avgTimeMs: number | null | undefined): string {
  if (typeof avgTimeMs !== "number" || !Number.isFinite(avgTimeMs)) return "-";
  return `${Math.max(0, Math.round(avgTimeMs))} ms`;
}

export function toMemoryLabel(avgMemoryKb: number | null | undefined): string {
  if (typeof avgMemoryKb !== "number" || !Number.isFinite(avgMemoryKb)) return "-";
  return `${(Math.max(0, avgMemoryKb) / 1024).toFixed(2)} MB`;
}

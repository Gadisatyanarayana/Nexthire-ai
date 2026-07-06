import { executeInSandbox } from "./dockerExecutor";
import type {
  CaseEvaluationResult,
  JudgeCase,
  JudgeJobData,
  QuestionEvaluationPayload,
  RawRunPayload,
  SupportedLanguage,
} from "./types";
import { buildBatchWrappedCode } from "./batchWrappers";
import { estimateComplexity } from "./complexityEstimator";
import {
  compareWithOutputType,
  detectFunctionName,
  hasUserDefinedMain,
  normalizeOutput,
  parseDiagnostics,
} from "./wrappers";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function max(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

function toAssessmentStats(cases: CaseEvaluationResult[], hidden: boolean) {
  const filtered = cases.filter((item) => Boolean(item.isHidden) === hidden);
  const passed = filtered.filter((item) => item.passed).length;

  return {
    total: filtered.length,
    passed,
    failed: Math.max(0, filtered.length - passed),
  };
}

type BatchCaseRecord = {
  index: number;
  output?: string;
  error?: string | null;
  timeMs?: number;
  memoryKb?: number | null;
};

function parseBatchCaseResults(stdout: string, totalCases: number): Array<BatchCaseRecord | undefined> {
  const parsed = new Array<BatchCaseRecord | undefined>(totalCases);
  const lines = String(stdout || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    try {
      const record = JSON.parse(line) as BatchCaseRecord;
      if (typeof record?.index !== "number" || record.index < 0 || record.index >= totalCases) continue;
      parsed[record.index] = record;
    } catch {
      continue;
    }
  }

  return parsed;
}

function mapStatusForCase(
  executionStatus: string,
  compileError: string,
  stderr: string
): "Accepted" | "Compile Error" | "Runtime Error" | "Time Limit Exceeded" {
  const normalized = String(executionStatus || "").toLowerCase();

  if (compileError) return "Compile Error";
  if (normalized.includes("time limit")) return "Time Limit Exceeded";
  if (stderr) return "Runtime Error";
  if (normalized.includes("compile")) return "Compile Error";
  if (normalized.includes("runtime")) return "Runtime Error";
  return "Accepted";
}

function maskCaseOutputForSubmit(caseResult: CaseEvaluationResult, submit: boolean): CaseEvaluationResult {
  if (!submit || !caseResult.isHidden) return caseResult;

  return {
    ...caseResult,
    input: "[Hidden Test Case]",
    expectedOutput: "[Hidden Expected Output]",
    output: caseResult.passed ? "[Hidden Case Passed]" : "[Hidden Case Failed]",
  };
}

function resolveCaseConcurrency(language: SupportedLanguage, totalCases: number): number {
  const defaultConcurrency = language === "java" || language === "cpp" ? 2 : 4;
  const raw = Number(process.env.JUDGE_CASE_PARALLELISM || defaultConcurrency);
  const bounded = Number.isFinite(raw)
    ? Math.max(1, Math.min(8, Math.floor(raw)))
    : defaultConcurrency;

  return Math.max(1, Math.min(totalCases, bounded));
}

export async function evaluateRawRun(payload: JudgeJobData): Promise<RawRunPayload> {
  const stdin = String(payload.stdin || "");
  const logger = (await import('./logger')).default as any;
  logger.info({event:"rawRunStart", language:payload.language});
  const execution = await executeInSandbox({
    language: payload.language,
    code: payload.code,
    stdin,
  });
  logger.info({event:"rawRunComplete", status:execution.status, compileError:execution.compileError});

  return {
    output: normalizeOutput(execution.stdout),
    error: normalizeOutput(execution.stderr),
    compile_error: normalizeOutput(execution.compileError),
    status: execution.status,
    execution_time_ms: execution.timeMs,
    memory_kb: execution.memoryKb,
    language: payload.language,
  };
}

export async function evaluateQuestion(payload: JudgeJobData): Promise<QuestionEvaluationPayload> {
  const language = payload.language as SupportedLanguage;
  const submitMode = payload.mode === "submit";
  const testcases = Array.isArray(payload.testcases) && payload.testcases.length > 0
    ? payload.testcases
    : [{ input: "", expectedOutput: "", isHidden: false } as JudgeCase];

  if (hasUserDefinedMain(language, payload.code)) {
    throw new Error("Do not add a main entrypoint. Write only the method inside class Solution.");
  }

  const functionName = detectFunctionName(language, payload.code, payload.functionName);
  const caseResults = new Array<CaseEvaluationResult>(testcases.length);
  const diagnostics = [] as QuestionEvaluationPayload["diagnostics"];
  const timings: number[] = [];
  const memories: number[] = [];
  let finalStatus: "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded" = "Accepted";
  const wrappedCode = buildBatchWrappedCode(language, payload.code, functionName, testcases, payload.inputType);
  const execution = await executeInSandbox({
    language,
    code: wrappedCode,
    stdin: "",
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "Execution failed";
    return {
      stdout: "",
      stderr: message,
      compileError: "",
      status: "Runtime Error" as const,
      exitCode: null,
      timedOut: false,
      timeMs: 0,
      memoryKb: null,
    };
  });

  let compileErrorOccurred = false;

  if (execution.compileError) {
    compileErrorOccurred = true;
    diagnostics.push(...parseDiagnostics(language, execution.compileError, "compile"));
    const compileMessage = normalizeOutput(execution.compileError) || "Compilation failed. Check diagnostics for details.";

    for (let i = 0; i < testcases.length; i += 1) {
      const testcase = testcases[i];
      caseResults[i] = maskCaseOutputForSubmit(
        {
          input: String(testcase.input || ""),
          output: compileMessage,
          expectedOutput: String(testcase.expectedOutput || ""),
          status: "Compile Error",
          passed: false,
          isHidden: Boolean(testcase.isHidden),
          timeMs: execution.timeMs,
          memoryKb: execution.memoryKb || undefined,
        },
        submitMode
      );
    }
  } else {
    const parsedResults = parseBatchCaseResults(execution.stdout, testcases.length);
    const runtimeFallbackMessage = normalizeOutput(execution.stderr) || normalizeOutput(execution.stdout);

    for (let i = 0; i < testcases.length; i += 1) {
      const testcase = testcases[i];
      const parsed = parsedResults[i];
      const output = normalizeOutput(parsed?.output || "");
      const expected = normalizeOutput(testcase.expectedOutput || "");
      const runtimeError = Boolean(parsed?.error) || (execution.status !== "Accepted" && !parsed);
      const timedOut = execution.status === "Time Limit Exceeded" && !parsed;

      // Determine verdict for this test case
      const status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded" = timedOut
        ? "Time Limit Exceeded"
        : runtimeError
        ? "Runtime Error"
        : compareWithOutputType(output, expected, payload.outputType)
          ? "Accepted"
          : "Wrong Answer";

      const passed = status === "Accepted";

      if (typeof parsed?.timeMs === "number") timings.push(parsed.timeMs);
      if (typeof parsed?.memoryKb === "number") memories.push(parsed.memoryKb);

      if (runtimeError && !parsed?.error && !runtimeFallbackMessage) {
        diagnostics.push({
          line: 0,
          severity: "error",
          source: "runtime",
          message: "Runtime failed before producing output. Check language runtime logs or server judge configuration.",
        });
      }

      caseResults[i] = maskCaseOutputForSubmit(
        {
          input: String(testcase.input || ""),
          output: output
            || parsed?.error
            || (runtimeError
              ? runtimeFallbackMessage || "Runtime failed before producing output. Check diagnostics for details."
              : "No output"),
          expectedOutput: String(testcase.expectedOutput || ""),
          status,
          passed,
          isHidden: Boolean(testcase.isHidden),
          timeMs: parsed?.timeMs ?? execution.timeMs,
          memoryKb: parsed?.memoryKb ?? execution.memoryKb ?? undefined,
        },
        submitMode
      );

      if (status === "Time Limit Exceeded") {
        finalStatus = "Time Limit Exceeded";
      } else if (status === "Runtime Error" && finalStatus !== "Time Limit Exceeded") {
        finalStatus = "Runtime Error";
      } else if (status === "Wrong Answer" && finalStatus === "Accepted") {
        finalStatus = "Wrong Answer";
      }
    }

    if (execution.stderr) {
      diagnostics.push(...parseDiagnostics(language, execution.stderr, "runtime"));
    }
  }

  const passedCount = caseResults.filter((item) => item && item.passed).length;
  const allPassed = caseResults.length > 0 && passedCount === caseResults.length;
  const result = compileErrorOccurred
    ? "Compile Error"
    : allPassed && finalStatus === "Accepted"
    ? "Accepted"
    : finalStatus;

  // Static complexity analysis — best effort, never blocks the result
  let complexity: QuestionEvaluationPayload["complexity"];
  try {
    complexity = estimateComplexity(language, payload.code);
  } catch {
    // non-fatal
  }

  return {
    mode: submitMode ? "submit" : "run",
    result,
    functionName,
    warnings: payload.caseSource ? [`Assessment source: ${payload.caseSource}`] : [],
    cases: caseResults,
    test_results: caseResults,
    summary: {
      total: caseResults.length,
      passed: passedCount,
      failed: caseResults.length - passedCount,
    },
    assessment: {
      mode: submitMode ? "platform" : "custom",
      source: payload.caseSource || (submitMode ? "db" : "custom"),
      sample: toAssessmentStats(caseResults, false),
      hidden: toAssessmentStats(caseResults, true),
    },
    executionStats: {
      avgTimeMs: average(timings),
      maxTimeMs: max(timings),
      avgMemoryKb: average(memories),
      maxMemoryKb: max(memories),
      measuredCases: Math.max(timings.length, memories.length),
    },
    diagnostics: diagnostics.slice(0, 12),
    complexity,
  };
}


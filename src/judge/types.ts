export type SupportedLanguage = "python" | "java" | "cpp" | "javascript";

export type ComplexityClass =
  | "O(1)"
  | "O(log N)"
  | "O(N)"
  | "O(N log N)"
  | "O(N\u00b2)"
  | "O(N\u00b3)"
  | "O(2^N)"
  | "O(N!)"
  | "Unknown";

export type ComplexityWarning = {
  severity: "info" | "warning" | "danger";
  message: string;
};

export type ComplexityInfo = {
  timeComplexity: ComplexityClass;
  spaceComplexity: ComplexityClass;
  warnings: ComplexityWarning[];
  isRecursive: boolean;
  maxLoopDepth: number;
  details: string;
};

export type JudgeRunMode = "run" | "submit";

export type InternalLanguageId = 1 | 2 | 3 | 4;

export const LANGUAGE_TO_RUNTIME_ID: Record<SupportedLanguage, InternalLanguageId> = {
  javascript: 1,
  python: 2,
  cpp: 3,
  java: 4,
};

export const RUNTIME_ID_TO_LANGUAGE: Record<number, SupportedLanguage> = {
  1: "javascript",
  2: "python",
  3: "cpp",
  4: "java",
};

export type JudgeCase = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

export type CompilerDiagnostic = {
  line: number;
  column?: number;
  severity: "error" | "warning" | "note";
  message: string;
  source: "compile" | "runtime";
};

export type CaseEvaluationResult = {
  input: string;
  output: string;
  expectedOutput: string;
  status: string;
  passed: boolean;
  isHidden?: boolean;
  timeMs?: number;
  memoryKb?: number;
};

export type ExecutionStats = {
  avgTimeMs: number | null;
  maxTimeMs: number | null;
  avgMemoryKb: number | null;
  maxMemoryKb: number | null;
  measuredCases: number;
};

export type AssessmentStats = {
  total: number;
  passed: number;
  failed: number;
};

export type QuestionEvaluationPayload = {
  mode: JudgeRunMode;
  result: string;
  functionName: string;
  warnings: string[];
  cases: CaseEvaluationResult[];
  test_results: CaseEvaluationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  assessment: {
    mode: "platform" | "custom";
    source: string;
    sample: AssessmentStats;
    hidden: AssessmentStats;
  };
  executionStats: ExecutionStats;
  diagnostics: CompilerDiagnostic[];
  complexity?: ComplexityInfo;
};

export type RawRunPayload = {
  output: string;
  error: string;
  compile_error: string;
  status: string;
  execution_time_ms: number | null;
  memory_kb: number | null;
  language: SupportedLanguage;
};

export type JudgeJobKind = "raw-run" | "question-evaluation";

export type JudgeJobData = {
  submissionId: string;
  kind: JudgeJobKind;
  code: string;
  language: SupportedLanguage;
  requestedAt: number;
  stdin?: string;
  mode?: JudgeRunMode;
  questionId?: string;
  testcases?: JudgeCase[];
  functionName?: string;
  inputType?: string;
  outputType?: string;
  caseSource?: string;
};

export type SubmissionState = "queued" | "running" | "completed" | "failed";

export type SubmissionEnvelope = {
  submissionId: string;
  state: SubmissionState;
  updatedAt: number;
  data?: QuestionEvaluationPayload | RawRunPayload;
  error?: string;
};

export type LoadedProblemCases = {
  problemId: string;
  source: "normalized_test_cases" | "questions_fallback";
  questionId: string | null;
  difficulty: string | null;
  functionName?: string;
  inputType?: string;
  outputType?: string;
  cases: JudgeCase[];
  visibleCount: number;
  hiddenCount: number;
};

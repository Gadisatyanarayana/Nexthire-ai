"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Group, Panel, Separator } from "react-resizable-panels";

import {
  CheckCircle2, ChevronLeft, ChevronRight, Bot, X, Plus, Trash2,
  RotateCcw, Send, Lock, Flame, Trophy, Target
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CodeEditor } from "@/components/coding/CodeEditor";
import { OutputConsole } from "@/components/coding/OutputConsole";
import { QuestionPanel } from "@/components/coding/QuestionPanel";
import { getStarterCodeForQuestion, LANGUAGE_TO_RUNTIME_ID, type CodingQuestion } from "@/lib/codingQuestions";
import { buildSubmissionSkillReport, type SubmissionSkillReport } from "@/lib/submissionSkillReport";
function generateDistributionData(userVal: number, mean: number, stdDev: number, isMemory: boolean) {
  const points = 12;
  const data = [];
  const minX = Math.max(0.1, mean - 2.5 * stdDev);
  const maxX = mean + 2.5 * stdDev;
  const range = maxX - minX;

  for (let i = 0; i < points; i++) {
    const x = minX + (range * i) / (points - 1);
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const frequency = Math.round(100 * Math.exp(exponent));
    data.push({
      x: x,
      displayX: isMemory ? `${(x / 1024).toFixed(1)} MB` : `${Math.round(x)} ms`,
      frequency: Math.max(4, frequency),
    });
  }

  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < data.length; i++) {
    const diff = Math.abs(data[i].x - userVal);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return data.map((item, idx) => ({
    ...item,
    isUser: idx === closestIndex,
  }));
}

/* ─── Types ────────────────────────────────────────── */
type ExecuteResponse = {
  result: string;
  passed?: number;
  total?: number;
  runtime?: string;
  memory?: string;
  failedInput?: string | null;
  language?: "cpp" | "java" | "python";
  submittedAt?: string;
  code?: string;
  submitted?: boolean;
  skillReport?: SubmissionSkillReport | null;
  aiFeedback?: string | null;
  submissionProof?: { token: string; expiresAt: number } | null;
  warnings?: string[];
  diagnostics?: Array<{
    line: number; column?: number;
    severity: "error" | "warning" | "note";
    message: string; source: "compile" | "runtime";
  }>;
  executionStats?: {
    avgTimeMs: number | null; maxTimeMs: number | null;
    avgMemoryKb: number | null; maxMemoryKb: number | null;
    measuredCases: number;
  } | null;
  assessment?: {
    mode: "platform" | "custom"; source: string;
    sample: { total: number; passed: number; failed: number };
    hidden: { total: number; passed: number; failed: number };
  } | null;
  cases: Array<{
    input: string; output: string; expectedOutput: string;
    status: string; passed: boolean; isHidden?: boolean;
    timeMs?: number; memoryKb?: number;
  }>;
};

type SubmitApiResponse = {
  submission_id?: string; state?: "queued" | "running" | "completed" | "failed";
  message?: string; result?: string; status: string;
  passed: number; total: number; runtime: string; memory: string;
  failed_input?: string; runtime_ms?: number | null; memory_kb?: number | null;
  executionStats?: ExecuteResponse["executionStats"];
  assessment?: ExecuteResponse["assessment"];
  summary?: { total: number; passed: number; failed: number };
  cases?: ExecuteResponse["cases"]; diagnostics?: ExecuteResponse["diagnostics"];
  source?: string; warnings?: string[]; error?: string;
};

type PendingJudgeResponse = {
  submission_id: string; state: "queued" | "running"; message?: string;
};
type JudgeEnvelopeResponse = {
  submissionId: string; state: "queued" | "running" | "completed" | "failed";
  updatedAt: number; data?: unknown; error?: string;
};
type SubmissionAnalytics = {
  acceptedPercent: number;
  totals: { submissions: number; accepted: number; uniqueUsers: number };
  benchmark: {
    runtimeMs: { best: number | null; p50: number | null; p90: number | null };
    memoryKb: { best: number | null; p50: number | null; p90: number | null };
  };
  leaderboard: Array<{
    rank: number; name: string; acceptedCount: number;
    totalSubmissions: number; acceptancePercent: number;
    bestRuntimeMs: number | null; bestMemoryKb: number | null;
  }>;
  history: Array<{
    id: string; result: string; language: string;
    passed: number; total: number;
    runtimeMs: number | null; memoryKb: number | null;
    failedInput: string | null; createdAt: string | null;
  }>;
};
type SubmissionHistoryItem = {
  id: string; status: string; language: string;
  runtime: string; memory: string;
  runtime_ms: number | null; memory_kb: number | null;
  passed: number; total: number; created_at: string | null;
  code?: string;
};
type LastAcceptedSubmission = SubmissionHistoryItem & { code: string };
type SubmissionHistoryResponse = {
  history?: SubmissionHistoryItem[]; lastAccepted?: LastAcceptedSubmission | null; error?: string;
};
type EditableCase = { input: string; expectedOutput: string };
type CoachChatMessage = { role: "user" | "assistant"; content: string };
type CoachMessageSegment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language: string };
type PerformanceInsights = {
  totalMeasuredRuns: number; avgTimeMs: number | null; bestTimeMs: number | null;
  avgMemoryKb: number | null; bestMemoryKb: number | null;
  timeTrend: "improving" | "stable" | "worse" | "unknown";
  memoryTrend: "improving" | "stable" | "worse" | "unknown";
  currentRunPercentile: { time: number | null; memory: number | null };
};

const COACH_MAX_HISTORY = 40;
const AUX_FETCH_TIMEOUT_MS = 3500;
const RESULT_POLL_INTERVAL_MS = 1500;
const RESULT_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/* ─── Helpers ───────────────────────────────────────── */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function splitCoachMessage(content: string): CoachMessageSegment[] {
  const segments: CoachMessageSegment[] = [];
  const codeRegex = /```([\w+-]*)\s*\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(content)) !== null) {
    const before = content.slice(cursor, match.index);
    if (before.trim()) segments.push({ type: "text", content: before });
    const lang = (match[1] || "").trim().toLowerCase() || "code";
    const code = (match[2] || "").replace(/^\n+|\n+$/g, "");
    if (code.trim()) segments.push({ type: "code", content: code, language: lang });
    cursor = match.index + match[0].length;
  }
  const trailing = content.slice(cursor);
  if (trailing.trim()) segments.push({ type: "text", content: trailing });
  if (segments.length === 0 && content.trim()) segments.push({ type: "text", content });
  return segments;
}
function coachMemoryKey(questionId: string | undefined, userEmail?: string | null) {
  if (!questionId) return null;
  return `nexthire:coach:${String(userEmail || "anon").toLowerCase()}:${questionId}`;
}
function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
function toClientRuntimeLabel(avgTimeMs: number | null | undefined): string {
  if (typeof avgTimeMs !== "number" || !Number.isFinite(avgTimeMs)) return "-";
  return `${Math.max(0, Math.round(avgTimeMs))} ms`;
}
function toClientMemoryLabel(avgMemoryKb: number | null | undefined): string {
  if (typeof avgMemoryKb !== "number" || !Number.isFinite(avgMemoryKb)) return "-";
  return `${(Math.max(0, avgMemoryKb) / 1024).toFixed(2)} MB`;
}
function isPendingJudgeResponse(v: unknown): v is PendingJudgeResponse {
  if (!v || typeof v !== "object") return false;
  const r = v as { submission_id?: unknown; state?: unknown };
  const state = String(r.state || "");
  return typeof r.submission_id === "string" && (state === "queued" || state === "running");
}
function isJudgeEnvelopeResponse(v: unknown): v is JudgeEnvelopeResponse {
  if (!v || typeof v !== "object") return false;
  const r = v as { submissionId?: unknown; state?: unknown };
  return typeof r.submissionId === "string" && typeof r.state === "string";
}
function contestChatBadgeStorageKey(contestId: string): string {
  return `contest-chat-badge:${contestId}`;
}
async function waitForQueuedResult(submissionId: string, timeoutMs = RESULT_POLL_TIMEOUT_MS): Promise<ExecuteResponse> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const res = await fetch(`/api/result/${submissionId}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as JudgeEnvelopeResponse & { error?: string };
    if (res.status === 429) { await sleep(RESULT_POLL_INTERVAL_MS); continue; }
    if (!res.ok) throw new Error(data.error || "Failed to fetch execution result.");
    if (!isJudgeEnvelopeResponse(data)) throw new Error("Invalid queued execution envelope received.");
    if (data.state === "failed") throw new Error(data.error || "Execution failed in queue worker.");
    if (data.state === "completed" && data.data && typeof data.data === "object") return data.data as ExecuteResponse;
    await sleep(RESULT_POLL_INTERVAL_MS);
  }
  throw new Error("Execution timed out. Please run again or switch to a smaller test case.");
}
async function fetchWithTimeout(input: string, signal: AbortSignal, timeoutMs = AUX_FETCH_TIMEOUT_MS) {
  const tc = new AbortController();
  const timer = setTimeout(() => tc.abort(), timeoutMs);
  const onAbort = () => tc.abort();
  signal.addEventListener("abort", onAbort, { once: true });
  try { return await fetch(input, { signal: tc.signal }); }
  finally { clearTimeout(timer); signal.removeEventListener("abort", onAbort); }
}
async function postJson<T>(url: string, body: Record<string, unknown>): Promise<{ response: Response; data: T }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T;
  return { response, data };
}
function toSubmitResponse(submissionId: string, payload: ExecuteResponse): SubmitApiResponse {
  const cases = Array.isArray(payload.cases) ? payload.cases : [];
  const total = typeof payload.total === "number" ? payload.total : cases.length;
  const passed = typeof payload.passed === "number" ? payload.passed : cases.filter((c) => c.passed).length;
  const accepted = total > 0 && passed === total && String(payload.result || "").toLowerCase() === "accepted";
  const status = accepted ? "Accepted" : (String(payload.result || "").trim() || "Wrong Answer");
  const failedCase = cases.find((c) => !c.passed) || null;
  const failedInput = failedCase
    ? failedCase.isHidden ? "[Hidden Test Case]" : String(failedCase.input || "")
    : undefined;
  const runtimeMs = typeof payload.executionStats?.avgTimeMs === "number" ? payload.executionStats.avgTimeMs : null;
  const memoryKb = typeof payload.executionStats?.avgMemoryKb === "number" ? payload.executionStats.avgMemoryKb : null;
  return {
    submission_id: submissionId, status, result: status,
    passed, total,
    runtime: toClientRuntimeLabel(runtimeMs), memory: toClientMemoryLabel(memoryKb),
    failed_input: status === "Wrong Answer" ? failedInput : undefined,
    runtime_ms: runtimeMs, memory_kb: memoryKb,
    executionStats: payload.executionStats || null,
    assessment: payload.assessment || null,
    diagnostics: payload.diagnostics || [],
    summary: { total, passed, failed: Math.max(0, total - passed) },
    cases,
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
  };
}

function AptitudeMcqPanel({
  question,
  selectedOption,
  setSelectedOption,
  executing,
  onSubmit,
  output,
}: {
  question: CodingQuestion;
  selectedOption: number | null;
  setSelectedOption: (idx: number) => void;
  executing: boolean;
  onSubmit: () => void;
  output: ExecuteResponse | null;
}) {
  const options = (question?.starter_code as any)?.options || [];
  const explanation = (question?.starter_code as any)?.explanation || "";
  
  const isAccepted = !!(output && String(output.result || "").toLowerCase().includes("accepted"));

  return (
    <div
      className="flex-1 flex flex-col p-6 rounded-xl border border-primary overflow-y-auto custom-scrollbar shadow-lg"
      style={{ background: "var(--bg-card)" }}
    >
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "var(--color-tle)" }}>
          Multiple Choice Question
        </span>
        <h3 className="text-sm font-semibold mt-3" style={{ color: "var(--text-primary)" }}>
          Select the correct option from the choices below:
        </h3>
      </div>

      <div className="space-y-3 mb-6">
        {options.map((opt: string, idx: number) => {
          const isSelected = selectedOption === idx;
          const labelLetter = String.fromCharCode(65 + idx); // A, B, C, D
          return (
            <button
              key={idx}
              type="button"
              disabled={executing || isAccepted}
              onClick={() => setSelectedOption(idx)}
              className="w-full text-left p-4 rounded-xl border border-primary transition-all hover:bg-hover hover:scale-[1.01] flex items-center gap-3 outline-none"
              style={{
                background: isSelected ? "rgba(0,184,163,0.06)" : "var(--bg-secondary)",
                border: isSelected ? "2px solid var(--color-easy)" : "1px solid var(--border-primary)",
                cursor: isAccepted ? "default" : "pointer"
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: isSelected ? "var(--color-easy)" : "var(--bg-tertiary)",
                  color: isSelected ? "#fff" : "var(--text-muted)",
                }}
              >
                {labelLetter}
              </div>
              <span className="text-xs font-medium" style={{ color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action / Result area */}
      <div className="mt-auto space-y-4">
        {output && (
          <div
            className="p-4 rounded-xl border flex flex-col gap-2"
            style={{
              background: isAccepted ? "rgba(0,184,163,0.06)" : "rgba(239,71,67,0.06)",
              borderColor: isAccepted ? "rgba(0,184,163,0.2)" : "rgba(239,71,67,0.2)"
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: isAccepted ? "var(--color-easy)" : "var(--color-wrong)" }}>
                {isAccepted ? "✓ Correct Answer!" : "✗ Wrong Answer!"}
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {isAccepted
                ? "Excellent! Your answer choice is correct. You can review the step-by-step reasoning below."
                : "The option you selected is incorrect. Check your calculations and try again!"}
            </p>
          </div>
        )}

        {isAccepted && explanation && (
          <div className="p-4 rounded-xl border border-primary space-y-2" style={{ background: "var(--bg-secondary)" }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Solution & Explanation
            </h4>
            <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {explanation}
            </p>
          </div>
        )}

        {!isAccepted && (
          <button
            type="button"
            disabled={executing || selectedOption === null}
            onClick={onSubmit}
            className="w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
            style={{
              background: selectedOption === null ? "var(--bg-hover)" : "var(--brand-green)",
              color: selectedOption === null ? "var(--text-muted)" : "#fff",
              cursor: selectedOption === null || executing ? "not-allowed" : "pointer",
              opacity: executing ? 0.7 : 1
            }}
          >
            {executing ? (
              <>
                <span className="spinner" />
                <span>Checking Answer...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Answer & Submit</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────── */
function QuestionDetailPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(true);

  const [userStats, setUserStats] = useState<any>(null);

  const loadUserStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setUserStats(data.stats);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (session) {
      void loadUserStats();
    }
  }, [session, loadUserStats]);

  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [language, setLanguage] = useState<"cpp" | "java" | "python">("python");
  const [code, setCode] = useState(getStarterCodeForQuestion(null, "python"));

  const isAptitude = question?.input_type === "aptitude";
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (isAptitude) {
      const idx = parseInt(code);
      if (Number.isInteger(idx)) {
        setSelectedOption(idx);
      } else {
        setSelectedOption(null);
      }
    }
  }, [code, isAptitude]);

  const [executing, setExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionWarnings, setExecutionWarnings] = useState<string[]>([]);
  const [output, setOutput] = useState<ExecuteResponse | null>(null);

  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [bottomPanelTab, setBottomPanelTab] = useState<"testcase" | "result">("testcase");
  const [executionMode, setExecutionMode] = useState<"run" | "submit" | null>(null);
  const [editableCases, setEditableCases] = useState<EditableCase[]>([]);
  const [editorMaximized, setEditorMaximized] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<CodingQuestion[]>([]);
  const [questionNavIds, setQuestionNavIds] = useState<string[]>([]);
  const [contestRemainingMs, setContestRemainingMs] = useState<number | null>(null);
  const [contestAiUnread, setContestAiUnread] = useState(0);
  const contestId = searchParams?.get("contestId");
  const contestEndsAt = searchParams?.get("contestEndsAt");
  const backHref = contestId ? `/contests/${contestId}` : "/coding";

  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);
  const [submissionAnalytics, setSubmissionAnalytics] = useState<SubmissionAnalytics | null>(null);
  const [solvedBefore, setSolvedBefore] = useState(false);
  const [restoringAcceptedCode, setRestoringAcceptedCode] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<"description" | "submission">("description");
  const [rightPanelTab, setRightPanelTab] = useState<"code" | "editorial" | "solutions" | "submissions">("code");
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);
  const [lastAcceptedSubmission, setLastAcceptedSubmission] = useState<LastAcceptedSubmission | null>(null);
  const [submissionHistoryLoading, setSubmissionHistoryLoading] = useState(false);
  const [submissionHistoryError, setSubmissionHistoryError] = useState<string | null>(null);
  const [progressAcceptedFallback, setProgressAcceptedFallback] = useState<{
    code: string; language: string | null; createdAt: string | null;
  } | null>(null);
  const [showSubmissionAnalysis, setShowSubmissionAnalysis] = useState(false);


  // Theme sync
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") !== "light");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Code reset on language change
  useEffect(() => {
    if (restoringAcceptedCode) { setRestoringAcceptedCode(false); return; }
    setCode(getStarterCodeForQuestion(question, language));
  }, [language, question, restoringAcceptedCode]);

  // Contest timer
  useEffect(() => {
    const endMs = contestEndsAt ? Date.parse(contestEndsAt) : NaN;
    if (!Number.isFinite(endMs)) { setContestRemainingMs(null); return; }
    const tick = () => {
      const remaining = Math.max(0, endMs - Date.now());
      setContestRemainingMs(remaining);
      if (remaining <= 0 && contestId) {
        router.push(`/contests/${contestId}?view=results`);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [contestEndsAt, contestId, router]);

  // Contest AI badge
  useEffect(() => {
    if (!contestId) { setContestAiUnread(0); return; }
    const readCount = () => {
      try {
        const raw = Number(window.localStorage.getItem(contestChatBadgeStorageKey(contestId)) || "0");
        setContestAiUnread(Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0);
      } catch { setContestAiUnread(0); }
    };
    readCount();
    window.addEventListener("focus", readCount);
    return () => window.removeEventListener("focus", readCount);
  }, [contestId]);

  // Load question nav order
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/questions?limit=300`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { questions?: Array<{ id: string }> };
        if (res.ok && Array.isArray(data.questions)) {
          const ids = data.questions.map((q) => String(q.id || "")).filter(Boolean);
          if (ids.length > 0) setQuestionNavIds(ids);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Load question data
  useEffect(() => {
    if (!params.id) return;
    const controller = new AbortController();

    async function loadQuestion() {
      try {
        setLoadingQuestion(true);
        setQuestionError(null);
        const res = await fetch(`/api/questions/${params.id}`, { signal: controller.signal });
        const data = (await res.json()) as { question?: CodingQuestion; error?: string };
        if (!res.ok || !data.question) throw new Error(data.error || "Question not found");
        setQuestion(data.question);
        setEditableCases(
          (data.question.testcases || []).slice(0, 3).map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
        );
        setLoadingQuestion(false);

        const [progressResult, similarResult] = await Promise.allSettled([
          fetchWithTimeout(`/api/questions/${params.id}/progress`, controller.signal),
          fetchWithTimeout(`/api/questions/similar/${params.id}`, controller.signal),
        ]);

        if (progressResult.status === "fulfilled") {
          const pRes = progressResult.value;
          const pData = (await pRes.json()) as {
            solved?: boolean; latestAcceptedCode?: string | null;
            latestAcceptedLanguage?: string | null; lastSolvedAt?: string | null;
          };
          if (pRes.ok) {
            setSolvedBefore(Boolean(pData.solved));
            const lang = String(pData.latestAcceptedLanguage || "").toLowerCase();
            const acceptedLang = lang === "cpp" || lang === "java" || lang === "python" ? lang : null;
            if (pData.latestAcceptedCode) {
              setProgressAcceptedFallback({ code: String(pData.latestAcceptedCode), language: acceptedLang, createdAt: pData.lastSolvedAt || null });
            }
            if (pData.latestAcceptedCode && acceptedLang) {
              setRestoringAcceptedCode(true);
              setLanguage(acceptedLang);
              setCode(pData.latestAcceptedCode);
            }
          }
        }
        if (similarResult.status === "fulfilled") {
          const sRes = similarResult.value;
          const sData = (await sRes.json()) as { similar?: CodingQuestion[] };
          if (sRes.ok && Array.isArray(sData.similar)) setSimilarQuestions(sData.similar);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setQuestionError(e instanceof Error ? e.message : "Failed to load question");
      } finally { setLoadingQuestion(false); }
    }

    void loadQuestion();
    return () => controller.abort();
  }, [params.id]);

  // Sync selected case index
  useEffect(() => {
    if (editableCases.length === 0) { setSelectedCaseIndex(0); return; }
    setSelectedCaseIndex((prev) => Math.min(prev, editableCases.length - 1));
  }, [editableCases.length]);



  // Load analytics
  const loadSubmissionAnalytics = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/questions/${params.id}/submissions`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as SubmissionAnalytics & { error?: string };
      if (res.ok) setSubmissionAnalytics(data);
    } catch {}
  }, [params.id]);

  useEffect(() => { void loadSubmissionAnalytics(); }, [loadSubmissionAnalytics]);

  const activeProblemId = useMemo(() => {
    if (!question) return "";
    const fromQuestion = (question as CodingQuestion & { problem_id?: string | null }).problem_id;
    return String(fromQuestion || question.id || "").trim();
  }, [question]);

  async function loadProblemSubmissionHistory(problemId: string) {
    const normalizedId = String(problemId || "").trim();
    if (!normalizedId) return;
    try {
      setSubmissionHistoryLoading(true);
      setSubmissionHistoryError(null);
      const query = new URLSearchParams({ problem_id: normalizedId, limit: "60" }).toString();
      const res = await fetch(`/api/submissions?${query}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as SubmissionHistoryResponse;
      if (!res.ok) { setSubmissionHistoryError(data.error || "Failed to load history."); return; }
      setSubmissionHistory(Array.isArray(data.history) ? data.history : []);
      setLastAcceptedSubmission(data.lastAccepted || null);
    } catch { setSubmissionHistoryError("Failed to load submission history."); }
    finally { setSubmissionHistoryLoading(false); }
  }

  useEffect(() => {
    if (!activeProblemId) return;
    void loadProblemSubmissionHistory(activeProblemId);
  }, [activeProblemId]);

  async function loadPerformanceInsights(currentStats?: ExecuteResponse["executionStats"]) {
    if (status !== "authenticated" || !session?.user?.email || !params.id) return;
    try {
      const pQ = new URLSearchParams();
      if (typeof currentStats?.avgTimeMs === "number") pQ.set("currentTimeMs", String(currentStats.avgTimeMs));
      if (typeof currentStats?.avgMemoryKb === "number") pQ.set("currentMemoryKb", String(currentStats.avgMemoryKb));
      const suffix = pQ.toString() ? `?${pQ.toString()}` : "";
      const res = await fetch(`/api/questions/${params.id}/performance${suffix}`);
      const data = (await res.json().catch(() => ({}))) as { insights?: PerformanceInsights };
      if (res.ok) setPerformanceInsights(data.insights || null);
    } catch {}
  }

  async function trackActivity(activityType: string, payload: Record<string, unknown>) {
    try {
      await fetch('/api/activity/track', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityType, source: 'question-page', payload }),
      });
    } catch {}
  }

  function isContestExpired(): boolean {
    if (!contestId || !contestEndsAt) return false;
    const ends = new Date(contestEndsAt).getTime();
    if (!Number.isFinite(ends)) return false;
    return Date.now() > ends;
  }

  const runnableCaseIndexes = useMemo(() => {
    return editableCases.reduce<number[]>((acc, tc, idx) => {
      if (tc.input.trim().length > 0) acc.push(idx);
      return acc;
    }, []);
  }, [editableCases]);

  const runCases = useMemo(() => {
    if (editableCases.length === 0) return question?.testcases.slice(0, 3) || [];
    return runnableCaseIndexes.map((idx) => editableCases[idx]);
  }, [editableCases, question?.testcases, runnableCaseIndexes]);

  const selectedEditableCase = editableCases[selectedCaseIndex] || null;
  const selectedResultCase = useMemo(() => {
    if (!output?.cases) return null;
    if (editableCases.length === 0) return output.cases[selectedCaseIndex] || null;
    const runPos = runnableCaseIndexes.indexOf(selectedCaseIndex);
    if (runPos < 0) return null;
    return output.cases[runPos] || null;
  }, [output?.cases, editableCases.length, runnableCaseIndexes, selectedCaseIndex]);

  function updateCase(index: number, key: "input" | "expectedOutput", value: string) {
    setEditableCases((prev) => prev.map((tc, idx) => (idx === index ? { ...tc, [key]: value } : tc)));
  }
  function addTestCase() {
    setEditableCases((prev) => {
      const next = [...prev, { input: "", expectedOutput: "" }];
      setSelectedCaseIndex(next.length - 1);
      return next;
    });
  }
  function removeTestCase(idx: number) {
    setEditableCases((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setSelectedCaseIndex((prev2) => Math.min(prev2, Math.max(0, next.length - 1)));
      return next;
    });
  }

  async function copySnippet(snippet: string, snippetId: string) {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedSnippetId(snippetId);
      setTimeout(() => setCopiedSnippetId((c) => (c === snippetId ? null : c)), 1600);
    } catch { setCopiedSnippetId(null); }
  }



  async function runCode() {
    if (!question) return;
    if (isContestExpired()) { setExecutionError("Contest time exceeded."); return; }
    try {
      setExecutionMode("run"); setExecuting(true);
      setExecutionError(null); setExecutionWarnings([]);
      setBottomPanelTab("result");
      const { response, data } = await postJson<ExecuteResponse | PendingJudgeResponse | { error?: string }>(
        "/api/execute",
        { code, language, testcases: runCases, functionName: question.function_name, inputType: question.input_type, outputType: question.output_type, submit: false, wait: true }
      );
      if (!response.ok) throw new Error((data as { error?: string }).error || "Execution failed");
      const resolved = isPendingJudgeResponse(data)
        ? await waitForQueuedResult(data.submission_id)
        : (data as ExecuteResponse);
      const cases = Array.isArray(resolved.cases) ? resolved.cases : [];
      const passed = typeof resolved.passed === "number" ? resolved.passed : cases.filter((c) => c.passed).length;
      const total = typeof resolved.total === "number" ? resolved.total : cases.length;
      setOutput({ result: resolved.result, passed, total, cases, skillReport: null, aiFeedback: null, executionStats: resolved.executionStats, submitted: false, diagnostics: resolved.diagnostics || [], assessment: resolved.assessment, language, submittedAt: new Date().toISOString(), code });
      void loadPerformanceInsights(resolved.executionStats);
      setExecutionWarnings(Array.isArray(resolved.warnings) ? resolved.warnings : []);
      const firstFailed = cases.findIndex((c) => !c.passed && !c.isHidden);
      if (firstFailed >= 0) setSelectedCaseIndex(firstFailed);
      else if (runnableCaseIndexes.length > 0) setSelectedCaseIndex(runnableCaseIndexes[0]);
      else if (cases.length > 0) setSelectedCaseIndex(0);
      void trackActivity('question_run', { questionId: question.id, language, cases: cases.length, passedCases: cases.filter((c) => c.passed).length });
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : "Execution failed");
    } finally { setExecuting(false); setExecutionMode(null); }
  }

  async function submitCode() {
    if (!question) return;
    if (isContestExpired()) { setExecutionError("Contest time exceeded."); return; }
    try {
      setExecutionMode("submit"); setExecuting(true);
      setExecutionError(null); setExecutionWarnings([]);
      setBottomPanelTab("result");
      const languageId = LANGUAGE_TO_RUNTIME_ID[language];
      if (typeof languageId !== "number") throw new Error("Unsupported language selected.");
      const problemId = String((question as CodingQuestion & { problem_id?: string | null }).problem_id || question.id);
      const { response, data } = await postJson<SubmitApiResponse | PendingJudgeResponse>(
        "/api/submit", { problem_id: problemId, code, language_id: languageId, wait: true }
      );
      if (!response.ok) throw new Error((data as SubmitApiResponse).error || "Submission failed");
      const finalData = isPendingJudgeResponse(data)
        ? toSubmitResponse(data.submission_id, await waitForQueuedResult(data.submission_id))
        : data;
      if (!finalData || typeof (finalData as SubmitApiResponse).status !== "string") {
        throw new Error((finalData as SubmitApiResponse)?.error || "Submission failed");
      }
      const fd = finalData as SubmitApiResponse;
      const accepted = String(fd.status || "").toLowerCase() === "accepted";
      const cases = Array.isArray(fd.cases) ? fd.cases : [];
      const visibleCases = cases.filter((c) => !c.isHidden);
      const skillReport = buildSubmissionSkillReport(question, code, language, visibleCases.length > 0 ? visibleCases : (output?.cases || []));
      setOutput({ result: fd.status, passed: fd.passed, total: fd.total, runtime: fd.runtime, memory: fd.memory, failedInput: fd.failed_input || null, cases, skillReport, aiFeedback: null, executionStats: fd.executionStats || null, submitted: true, diagnostics: fd.diagnostics || [], assessment: fd.assessment, language, submittedAt: new Date().toISOString(), code });
      setShowSubmissionAnalysis(true); setLeftPanelTab("submission"); setBottomPanelTab("result");
      void loadPerformanceInsights(fd.executionStats || undefined);
      void loadSubmissionAnalytics();
      void loadProblemSubmissionHistory(problemId);
      if (accepted) {
        setSolvedBefore(true);
        setProgressAcceptedFallback({ code, language, createdAt: new Date().toISOString() });
        void (async () => {
          try {
            const aiRes = await fetch('/api/ai-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, language }) });
            const aiData = (await aiRes.json().catch(() => ({}))) as { feedback?: string };
            if (aiRes.ok && aiData.feedback) setOutput((prev) => (prev ? { ...prev, aiFeedback: aiData.feedback } : prev));
          } catch {}
        })();
      }
      void trackActivity("question_submit", { questionId: question.id, language, accepted, totalCases: fd.total });
      void loadUserStats();
    } catch (e) {
      setBottomPanelTab("result");
      setExecutionError(e instanceof Error ? e.message : "Submission failed");
    } finally { setExecuting(false); setExecutionMode(null); }
  }

  const currentQuestionPosition = useMemo(() => {
    const id = String(params.id || "");
    if (!id || questionNavIds.length === 0) return -1;
    return questionNavIds.indexOf(id);
  }, [params.id, questionNavIds]);
  const hasPrevQuestion = currentQuestionPosition > 0;
  const hasNextQuestion = currentQuestionPosition >= 0 && currentQuestionPosition < questionNavIds.length - 1;
  function navigateQuestion(direction: -1 | 1) {
    if (currentQuestionPosition < 0) return;
    const nextPos = currentQuestionPosition + direction;
    if (nextPos < 0 || nextPos >= questionNavIds.length) return;
    const nextId = questionNavIds[nextPos];
    const query = searchParams?.toString();
    router.push(`/question/${nextId}${query ? `?${query}` : ""}`);
  }

  const resolvedLastAccepted = useMemo(() => {
    if (lastAcceptedSubmission) return lastAcceptedSubmission;
    if (!progressAcceptedFallback) return null;
    return { id: "progress-fallback", status: "Accepted", language: String(progressAcceptedFallback.language || "-").toLowerCase(), runtime: "-", memory: "-", runtime_ms: null, memory_kb: null, passed: 0, total: 0, created_at: progressAcceptedFallback.createdAt, code: progressAcceptedFallback.code } as LastAcceptedSubmission;
  }, [lastAcceptedSubmission, progressAcceptedFallback]);

  /* ─── Render ──────────────────────────────────────── */
  return (
    <main
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", background: "var(--bg-primary)" }}
    >
      {/* ── TOP NAV BAR ── */}
      <div
        className="flex items-center justify-between gap-2 px-3 flex-shrink-0"
        style={{ height: "48px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={backHref}
            className="btn btn-ghost"
            style={{ padding: "5px 10px", fontSize: "12px", flexShrink: 0 }}
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
            {contestId ? "Contest" : "Problems"}
          </Link>

          <div
            style={{ width: 1, height: 20, background: "var(--border-primary)", flexShrink: 0 }}
          />

          <button
            type="button"
            onClick={() => navigateQuestion(-1)}
            disabled={!hasPrevQuestion}
            className="btn btn-ghost"
            style={{ padding: "4px 6px" }}
            title="Previous Problem"
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            onClick={() => navigateQuestion(1)}
            disabled={!hasNextQuestion}
            className="btn btn-ghost"
            style={{ padding: "4px 6px" }}
            title="Next Problem"
          >
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>

          {question && (
            <span
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)", maxWidth: "240px" }}
            >
              {question.title}
            </span>
          )}
          {question && (
            <span
              className="text-xs font-semibold rounded-full px-2 py-0.5 shrink-0"
              style={{
                color: question.difficulty === "Easy" ? "var(--color-easy)" : question.difficulty === "Medium" ? "var(--color-medium)" : "var(--color-hard)",
                background: question.difficulty === "Easy" ? "rgba(0,184,163,0.12)" : question.difficulty === "Medium" ? "rgba(255,161,22,0.12)" : "rgba(239,71,67,0.12)",
              }}
            >
              {question.difficulty}
            </span>
          )}
            {solvedBefore && (
              <CheckCircle2 style={{ width: 15, height: 15, color: "var(--color-easy)", flexShrink: 0 }} />
            )}

        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Link to full progress page */}
          <a
            href="/coding/profile"
            className="btn btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold select-none transition hover:opacity-80"
            style={{
              color: userStats?.currentStreak > 0 ? "var(--color-wrong)" : "var(--text-secondary)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-tertiary)",
              textDecoration: "none"
            }}
            title="View My Progress"
          >
            <Flame className="h-4 w-4" style={{ fill: userStats?.currentStreak > 0 ? "var(--color-wrong)" : "none" }} />
            <span>{userStats?.currentStreak || 0}d</span>
          </a>

          {contestRemainingMs !== null && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{
                background: contestRemainingMs <= 300000 ? "rgba(239,71,67,0.15)" : "rgba(0,184,163,0.1)",
                color: contestRemainingMs <= 300000 ? "var(--color-wrong)" : "var(--color-easy)",
                border: `1px solid ${contestRemainingMs <= 300000 ? "rgba(239,71,67,0.25)" : "rgba(0,184,163,0.2)"}`,
              }}
            >
              ⏱ {formatCountdown(contestRemainingMs)}
            </span>
          )}

          {/* Language selector */}
          <div
            className="flex items-center rounded-md p-0.5"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
          >
            {(["cpp", "java", "python"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className="px-3 py-1 text-xs font-semibold rounded transition-all"
                style={{
                  background: language === lang ? "var(--bg-secondary)" : "transparent",
                  color: language === lang ? "var(--text-primary)" : "var(--text-muted)",
                  border: language === lang ? "1px solid var(--border-secondary)" : "1px solid transparent",
                  boxShadow: language === lang ? "var(--shadow-sm)" : "none",
                }}
              >
                {lang === "cpp" ? "C++" : lang === "java" ? "Java" : "Python"}
              </button>
            ))}
          </div>


        </div>
      </div>

      {/* ── LOADING / ERROR ── */}
      {loadingQuestion && (
        <div className="flex-1 flex min-h-0 relative p-2 gap-2">
          {/* Left Panel (Description) */}
          <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <div className="h-10 skeleton border-b border-[var(--border-primary)]" />
            <div className="p-5 space-y-4">
              <div className="w-3/4 h-8 skeleton rounded" />
              <div className="w-1/4 h-5 skeleton rounded" />
              <div className="space-y-2 mt-8">
                <div className="w-full h-4 skeleton rounded" />
                <div className="w-full h-4 skeleton rounded" />
                <div className="w-5/6 h-4 skeleton rounded" />
              </div>
              <div className="mt-8 h-32 skeleton rounded-xl" />
            </div>
          </div>

          {/* Right Section (Editor + Console) */}
          <div className="flex-[1.4] flex flex-col gap-2 min-w-0">
            <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
              <div className="h-10 skeleton border-b border-[var(--border-primary)] flex items-center px-3 gap-2">
                <div className="w-20 h-5 skeleton rounded" />
              </div>
              <div className="flex-1 p-4 space-y-2">
                 <div className="w-1/2 h-4 skeleton rounded opacity-50" />
                 <div className="w-1/3 h-4 skeleton rounded opacity-50" />
              </div>
            </div>
            
            <div className="h-[250px] rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
              <div className="h-10 skeleton border-b border-[var(--border-primary)] flex items-center px-3 gap-2">
                <div className="w-24 h-5 skeleton rounded" />
                <div className="w-24 h-5 skeleton rounded" />
              </div>
              <div className="flex-1 p-4">
                 <div className="w-full h-12 skeleton rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}
      {questionError && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="rounded-xl p-6 text-center max-w-md" style={{ background: "rgba(239,71,67,0.08)", border: "1px solid rgba(239,71,67,0.2)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-wrong)" }}>{questionError}</p>
            <Link href="/coding" className="btn btn-ghost mt-4" style={{ display: "inline-flex" }}>Back to Problems</Link>
          </div>
        </div>
      )}

      {/* ── MAIN PANELS ── */}
      {!loadingQuestion && question && (
        <div className="flex-1 min-h-0" style={{ padding: "4px" }}>
          <Group
            orientation="horizontal"
            style={{ height: "100%", gap: "4px" }}
          >
            {/* ─ LEFT: Description / Submissions ─ */}
            {!editorMaximized && (
              <>
                <Panel defaultSize={38} minSize={26}>
                  <div className="flex flex-col h-full min-h-0" style={{ gap: "4px" }}>
                    {/* Left tab bar */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0 px-2 py-1.5"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setLeftPanelTab("description")}
                        className="tab-btn"
                        data-active={leftPanelTab === "description" ? "true" : undefined}
                      >
                        <span className={leftPanelTab === "description" ? "active" : ""}
                          style={{ padding: "4px 12px", borderRadius: "var(--radius-md)", display: "block", fontWeight: leftPanelTab === "description" ? "600" : "500", color: leftPanelTab === "description" ? "var(--text-primary)" : "var(--text-secondary)", background: leftPanelTab === "description" ? "var(--bg-active)" : "transparent" }}
                        >
                          Description
                        </span>
                      </button>

                      {showSubmissionAnalysis && output && (
                        <button
                          type="button"
                          onClick={() => setLeftPanelTab("submission")}
                          className="tab-btn flex items-center gap-1.5"
                          data-active={leftPanelTab === "submission" ? "true" : undefined}
                        >
                          <span className={leftPanelTab === "submission" ? "active" : ""}
                            style={{ padding: "4px 12px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "6px", fontWeight: leftPanelTab === "submission" ? "600" : "500", color: leftPanelTab === "submission" ? (String(output.result || "").toLowerCase().includes("accepted") ? "var(--color-easy)" : "var(--color-wrong)") : "var(--text-secondary)", background: leftPanelTab === "submission" ? "var(--bg-active)" : "transparent" }}
                          >
                            <span>{output.result}</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSubmissionAnalysis(false);
                                setLeftPanelTab("description");
                              }}
                              className="hover:bg-foreground/15 rounded-full p-0.5 transition flex items-center justify-center cursor-pointer"
                            >
                              <X style={{ width: 11, height: 11 }} />
                            </span>
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Left panel content */}
                    <div className="flex-1 min-h-0">
                      {leftPanelTab === "description" ? (
                        <QuestionPanel question={question} isDark={isDark} similarQuestions={similarQuestions} />
                      ) : showSubmissionAnalysis && output ? (
                        <div
                          className="h-full overflow-y-auto no-scrollbar"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)", padding: "14px" }}
                        >
                          {/* Title */}
                          <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "1px solid var(--border-primary)" }}>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Submission Details</p>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSubmissionAnalysis(false);
                                setLeftPanelTab("description");
                              }}
                              className="btn btn-ghost text-xs"
                              style={{ padding: "2px 8px", fontSize: "11px" }}
                            >
                              Close
                            </button>
                          </div>

                          {/* Status + stats */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="col-span-2 rounded-lg p-3" style={{
                              background: String(output.result || "").toLowerCase().includes("accepted") ? "rgba(0,184,163,0.08)" : "rgba(239,71,67,0.08)",
                              border: `1px solid ${String(output.result || "").toLowerCase().includes("accepted") ? "rgba(0,184,163,0.2)" : "rgba(239,71,67,0.2)"}`,
                            }}>
                              <p className="text-base font-bold" style={{ color: String(output.result || "").toLowerCase().includes("accepted") ? "var(--color-easy)" : "var(--color-wrong)" }}>
                                {output.result}
                              </p>
                              {typeof output.passed === "number" && typeof output.total === "number" && (
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  {output.passed}/{output.total} test cases passed
                                </p>
                              )}
                              {output.submittedAt && (
                                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                                  Submitted at {new Date(output.submittedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="rounded-lg p-2.5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Runtime</p>
                              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                {output.runtime || (typeof output.executionStats?.avgTimeMs === "number" ? `${output.executionStats.avgTimeMs.toFixed(1)} ms` : "-")}
                              </p>
                            </div>
                            <div className="rounded-lg p-2.5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Memory</p>
                              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                {output.memory || (typeof output.executionStats?.avgMemoryKb === "number" ? `${(output.executionStats.avgMemoryKb / 1024).toFixed(2)} MB` : "-")}
                              </p>
                            </div>
                          </div>

                          {/* Skill report */}
                          {output.skillReport && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {[
                                { label: "Overall Score", value: output.skillReport.overallScore },
                                { label: "Approach Quality", value: output.skillReport.approachQuality },
                                { label: "Optimization", value: output.skillReport.optimizationQuality },
                                { label: "Edge Cases", value: output.skillReport.edgeCaseQuality },
                              ].map(({ label, value }) => (
                                <div key={label} className="rounded-lg p-2.5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 rounded-full" style={{ height: 4, background: "var(--bg-hover)" }}>
                                      <div className="rounded-full h-full" style={{ width: `${value}%`, background: value >= 70 ? "var(--color-accepted)" : value >= 40 ? "var(--color-tle)" : "var(--color-wrong)" }} />
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)", minWidth: "28px" }}>{value}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {output.skillReport && output.skillReport.improvements.length > 0 && (
                            <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(255,161,22,0.06)", border: "1px solid rgba(255,161,22,0.15)" }}>
                              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-tle)" }}>Improvements</p>
                              <ul className="space-y-1">
                                {output.skillReport.improvements.slice(0, 3).map((item) => (
                                  <li key={item} className="text-xs" style={{ color: "var(--text-secondary)" }}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                              {/* Runtime & Memory Distribution Graphs (LeetCode-style) */}
                              {String(output.result || "").toLowerCase() === "accepted" && (output.runtime || output.executionStats?.avgTimeMs) && (() => {
                                const avgTime = output.executionStats?.avgTimeMs ?? 40;
                                const timeP = performanceInsights?.currentRunPercentile?.time ?? 50;
                                const timeMean = avgTime * (1 + (timeP - 50) / 50);
                                const timeData = generateDistributionData(avgTime, timeMean, timeMean * 0.35, false);

                                const avgMem = output.executionStats?.avgMemoryKb ?? 16000;
                                const memP = performanceInsights?.currentRunPercentile?.memory ?? 50;
                                const memMean = avgMem * (1 + (memP - 50) / 50);
                                const memData = generateDistributionData(avgMem, memMean, memMean * 0.35, true);

                                return (
                                  <div className="space-y-3 mb-3">
                                    <div className="rounded-lg p-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                      <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                        Runtime Distribution
                                      </h4>
                                      {typeof timeP === "number" && (
                                        <p className="text-[11px] mb-2" style={{ color: "var(--color-accepted)" }}>
                                          Beats {timeP.toFixed(1)}% of users
                                        </p>
                                      )}
                                      <div style={{ width: "100%", height: 100 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={timeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.08)" vertical={false} />
                                            <XAxis dataKey="displayX" tick={{ fontSize: 8, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 8, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const dp = payload[0].payload;
                                                  return (
                                                    <div className="rounded px-2 py-1 text-[10px]" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
                                                      <p className="font-semibold">{dp.displayX}</p>
                                                      <p style={{ color: dp.isUser ? "var(--brand-green)" : "var(--text-muted)" }}>
                                                        {dp.isUser ? "Your Submission" : "Users Frequency"}
                                                      </p>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }}
                                            />
                                            <Bar dataKey="frequency" radius={[2, 2, 0, 0]}>
                                              {timeData.map((entry, index) => (
                                                <Cell key={`cell-time-${index}`} fill={entry.isUser ? "var(--brand-green, #00b8a3)" : "rgba(156, 163, 175, 0.15)"} />
                                              ))}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>

                                    <div className="rounded-lg p-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                      <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                        Memory Distribution
                                      </h4>
                                      {typeof memP === "number" && (
                                        <p className="text-[11px] mb-2" style={{ color: "var(--color-accepted)" }}>
                                          Beats {memP.toFixed(1)}% of users
                                        </p>
                                      )}
                                      <div style={{ width: "100%", height: 100 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={memData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.08)" vertical={false} />
                                            <XAxis dataKey="displayX" tick={{ fontSize: 8, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 8, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const dp = payload[0].payload;
                                                  return (
                                                    <div className="rounded px-2 py-1 text-[10px]" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
                                                      <p className="font-semibold">{dp.displayX}</p>
                                                      <p style={{ color: dp.isUser ? "var(--brand-green)" : "var(--text-muted)" }}>
                                                        {dp.isUser ? "Your Submission" : "Users Frequency"}
                                                      </p>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }}
                                            />
                                            <Bar dataKey="frequency" radius={[2, 2, 0, 0]}>
                                              {memData.map((entry, index) => (
                                                <Cell key={`cell-mem-${index}`} fill={entry.isUser ? "var(--brand-green, #00b8a3)" : "rgba(156, 163, 175, 0.15)"} />
                                              ))}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Code block */}
                              {output.code && (
                                <div className="mt-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Submitted Code</p>
                                  <pre className="code-block text-[11px] overflow-x-auto max-h-60" style={{ background: "var(--surface-inset)", border: "1px solid var(--border-primary)", padding: "10px", borderRadius: "6px" }}>{output.code}</pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
                              No submission details active. Submit code or select a past submission from the Submissions tab.
                            </div>
                          )}
                        </div>
                      </div>
                    </Panel>
                    <Separator />
                  </>
                )}

            {/* ─ RIGHT: Editor / Submissions / Editorial / Solutions ─ */}
            <Panel defaultSize={editorMaximized ? 100 : 62} minSize={35}>
              <div className="flex flex-col h-full min-h-0" style={{ gap: "4px" }}>
                {/* Right tab bar */}
                <div
                  className="flex items-center gap-1 flex-shrink-0 px-2 py-1.5"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)" }}
                >
                  {(["code", "editorial", "solutions", "submissions"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRightPanelTab(tab)}
                      className="tab-btn"
                      style={{ textTransform: "capitalize" }}
                      data-active={rightPanelTab === tab ? "true" : undefined}
                    >
                      <span className={rightPanelTab === tab ? "active" : ""}
                        style={{ padding: "4px 12px", borderRadius: "var(--radius-md)", display: "block", fontWeight: rightPanelTab === tab ? "600" : "500", color: rightPanelTab === tab ? "var(--text-primary)" : "var(--text-secondary)", background: rightPanelTab === tab ? "var(--bg-active)" : "transparent" }}
                      >
                        {tab === "code" ? "Code" : tab === "editorial" ? "Editorial" : tab === "solutions" ? "Solutions" : "Submissions"}
                      </span>
                    </button>
                  ))}
                </div>

                {rightPanelTab === "code" ? (
                  isAptitude && question ? (
                    <AptitudeMcqPanel
                      question={question}
                      selectedOption={selectedOption}
                      setSelectedOption={(idx) => {
                        setSelectedOption(idx);
                        setCode(String(idx));
                      }}
                      executing={executing}
                      onSubmit={() => void submitCode()}
                      output={output}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col min-h-0" style={{ gap: "4px" }}>
                      {/* Submitting notice */}
                      {executing && executionMode === "submit" && (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs flex-shrink-0"
                          style={{ background: "rgba(255,161,22,0.08)", border: "1px solid rgba(255,161,22,0.2)", color: "var(--color-tle)" }}
                        >
                          <span className="spinner" />
                          Running sample + hidden test cases… This may take a few seconds.
                        </div>
                      )}

                      {/* Code Editor */}
                      <div style={{ flex: "1 1 0%", minHeight: "200px", overflow: "hidden" }}>
                        <Group orientation="vertical" style={{ height: "100%" }}>
                          <Panel defaultSize={62} minSize={35}>
                            <CodeEditor
                              isDark={isDark}
                              language={language}
                              code={code}
                              isMaximized={editorMaximized}
                              onToggleMaximize={() => setEditorMaximized((v) => !v)}
                              onRun={() => void runCode()}
                              onSubmit={() => void submitCode()}
                              executing={executing}
                              executionMode={executionMode}
                              diagnostics={output?.diagnostics || []}
                              onChange={setCode}
                              onResetCode={() => {
                                if (!question) return;
                                setCode(getStarterCodeForQuestion(question, language));
                                setExecutionError(null);
                                setExecutionWarnings([]);
                                setOutput(null);
                              }}
                            />
                          </Panel>

                          <Separator />

                          {/* Bottom panel: Test Cases / Result */}
                          <Panel defaultSize={38} minSize={20}>
                            <div
                              className="flex flex-col h-full min-h-0 overflow-hidden"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)" }}
                            >
                              {/* Tab bar */}
                              <div
                                className="flex items-center gap-2 px-3 flex-shrink-0"
                                style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-secondary)", height: "40px" }}
                              >
                                <div className="flex items-center gap-1">
                                  {(["testcase", "result"] as const).map((tab) => (
                                    <button
                                      key={tab}
                                      type="button"
                                      onClick={() => setBottomPanelTab(tab)}
                                      className="tab-btn"
                                    >
                                      <span
                                        style={{
                                          padding: "3px 10px",
                                          borderRadius: "var(--radius-sm)",
                                          display: "block",
                                          fontSize: "12px",
                                          fontWeight: bottomPanelTab === tab ? 600 : 500,
                                          color: bottomPanelTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                                          background: bottomPanelTab === tab ? "var(--bg-active)" : "transparent",
                                        }}
                                      >
                                        {tab === "testcase" ? "Testcase" : "Result"}
                                      </span>
                                    </button>
                                  ))}
                                </div>

                                {/* Case selector tabs (only on testcase tab) */}
                                {bottomPanelTab === "testcase" && editableCases.length > 0 && (
                                  <div className="flex items-center gap-1 overflow-x-auto flex-1 no-scrollbar">
                                    {editableCases.map((_, idx) => (
                                      <button
                                        key={`ct-${idx}`}
                                        type="button"
                                        onClick={() => setSelectedCaseIndex(idx)}
                                        className="testcase-tab shrink-0"
                                        style={{
                                          background: selectedCaseIndex === idx ? "var(--bg-active)" : "transparent",
                                          borderColor: selectedCaseIndex === idx ? "var(--border-secondary)" : "transparent",
                                          color: selectedCaseIndex === idx ? "var(--text-primary)" : "var(--text-muted)",
                                        }}
                                      >
                                        Case {idx + 1}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Add/Remove case buttons */}
                                {bottomPanelTab === "testcase" && (
                                  <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                    <button type="button" onClick={addTestCase} className="btn btn-ghost" style={{ padding: "3px 6px" }} title="Add test case">
                                      <Plus style={{ width: 12, height: 12 }} />
                                    </button>
                                    {editableCases.length > 1 && (
                                      <button type="button" onClick={() => removeTestCase(selectedCaseIndex)} className="btn btn-ghost" style={{ padding: "3px 6px" }} title="Remove this case">
                                        <Trash2 style={{ width: 12, height: 12 }} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Panel body */}
                              <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: "10px" }}>
                                {bottomPanelTab === "testcase" ? (
                                  selectedEditableCase ? (
                                    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                      {/* Input */}
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Input</p>
                                        <textarea
                                          rows={5}
                                          value={selectedEditableCase.input}
                                          onChange={(e) => updateCase(selectedCaseIndex, "input", e.target.value)}
                                          placeholder="Enter input..."
                                          className="w-full rounded-md px-3 py-2 text-xs outline-none resize-none font-mono"
                                          style={{ background: "var(--surface-inset)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                                          spellCheck={false}
                                        />
                                      </div>

                                      {/* Result for this case */}
                                      <div>
                                        {selectedResultCase ? (
                                          <>
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Output</p>
                                              <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                style={{
                                                  background: selectedResultCase.passed ? "rgba(0,184,163,0.15)" : "rgba(239,71,67,0.15)",
                                                  color: selectedResultCase.passed ? "var(--color-easy)" : "var(--color-wrong)",
                                                }}
                                              >
                                                {selectedResultCase.passed ? "✓ Pass" : "✗ Fail"}
                                              </span>
                                              {typeof selectedResultCase.timeMs === "number" && (
                                                <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>{selectedResultCase.timeMs} ms</span>
                                              )}
                                            </div>
                                            <pre
                                              className="rounded-md px-3 py-2 text-xs overflow-x-auto"
                                              style={{ background: "var(--surface-inset)", color: selectedResultCase.passed ? "var(--color-easy)" : "var(--color-wrong)", border: `1px solid ${selectedResultCase.passed ? "rgba(0,184,163,0.2)" : "rgba(239,71,67,0.2)"}`, fontFamily: "var(--font-mono)", lineHeight: 1.6, minHeight: "48px" }}
                                            >
                                              {selectedResultCase.output || "(empty)"}
                                            </pre>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide mt-2 mb-1" style={{ color: "var(--text-muted)" }}>Expected</p>
                                            <pre
                                              className="rounded-md px-3 py-2 text-xs overflow-x-auto"
                                              style={{ background: "var(--surface-inset)", color: "var(--color-easy)", border: "1px solid rgba(0,184,163,0.15)", fontFamily: "var(--font-mono)", lineHeight: 1.6, minHeight: "48px" }}
                                            >
                                              {output?.submitted ? "Hidden" : (selectedResultCase.expectedOutput || "(empty)")}
                                            </pre>
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Expected Output</p>
                                            <textarea
                                              rows={5}
                                              value={selectedEditableCase.expectedOutput}
                                              onChange={(e) => updateCase(selectedCaseIndex, "expectedOutput", e.target.value)}
                                              placeholder="Expected output (optional)..."
                                              className="w-full rounded-md px-3 py-2 text-xs outline-none resize-none font-mono"
                                              style={{ background: "var(--surface-inset)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                                              spellCheck={false}
                                            />
                                            <p className="text-xs mt-3 text-center" style={{ color: "var(--text-muted)" }}>
                                              {selectedEditableCase.input.trim() ? "Run your code to see output →" : "Add input above to test"}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <div className="text-center">
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No test cases yet.</p>
                                        <button type="button" onClick={addTestCase} className="btn btn-ghost mt-2" style={{ fontSize: "12px" }}>
                                          <Plus style={{ width: 12, height: 12 }} />
                                          Add Test Case
                                        </button>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <OutputConsole
                                    isDark={isDark}
                                    loading={executing}
                                    result={output}
                                    error={executionError}
                                    performanceInsights={performanceInsights}
                                  />
                                )}
                              </div>
                            </div>
                          </Panel>
                        </Group>
                      </div>
                    </div>
                  )
                ) : rightPanelTab === "submissions" ? (
                  <div
                    className="flex-1 overflow-y-auto"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)", padding: "14px" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Submission History</p>
                      <button type="button" onClick={() => { if (activeProblemId) void loadProblemSubmissionHistory(activeProblemId); }} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: "11px" }}>
                        Refresh
                      </button>
                    </div>

                    {submissionHistoryLoading && <div className="spinner" />}
                    {submissionHistoryError && <p className="text-xs" style={{ color: "var(--color-wrong)" }}>{submissionHistoryError}</p>}
                    {!submissionHistoryLoading && submissionHistory.length === 0 && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>No submissions yet. Submit to start tracking.</p>
                    )}

                    <div className="space-y-2">
                      {submissionHistory.map((item) => {
                        const isAcc = String(item.status || "").toLowerCase().includes("accept");
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              const lang = String(item.language).toLowerCase() as "cpp" | "java" | "python";
                              setRestoringAcceptedCode(true);
                              setLanguage(lang);
                              setCode(item.code || "");
                              
                              setOutput({
                                result: item.status,
                                passed: item.passed,
                                total: item.total,
                                runtime: item.runtime,
                                memory: item.memory,
                                submittedAt: item.created_at || undefined,
                                code: item.code || "",
                                submitted: true,
                                cases: [],
                                skillReport: null,
                                aiFeedback: null,
                              });
                              
                              setShowSubmissionAnalysis(true);
                              setLeftPanelTab("submission");
                            }}
                            className="rounded-lg p-3 cursor-pointer hover:bg-foreground/5 border transition-all"
                            style={{ background: "var(--bg-secondary)", borderColor: isAcc ? "rgba(0,184,163,0.2)" : "rgba(255,255,255,0.06)" }}
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-semibold" style={{ color: isAcc ? "var(--color-easy)" : "var(--color-wrong)" }}>{item.status}</span>
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>{item.language.toUpperCase()}</span>
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.passed}/{item.total}</span>
                              <span className="ml-auto text-[11px]" style={{ color: "var(--text-muted)" }}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</span>
                            </div>
                            <div className="flex gap-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
                              <span>Runtime: {item.runtime}</span>
                              <span>Memory: {item.memory}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {resolvedLastAccepted && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Best Accepted Solution</p>
                        <pre className="code-block text-[11px] overflow-x-auto max-h-48" style={{ background: "var(--surface-inset)", border: "1px solid var(--border-primary)", padding: "8px", borderRadius: "4px" }}>{resolvedLastAccepted.code}</pre>
                      </div>
                    )}
                  </div>
                ) : rightPanelTab === "editorial" ? (
                  <div
                    className="flex-grow min-h-0 overflow-y-auto"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)", padding: "16px" }}
                  >
                    <h3 className="text-base font-bold mb-4">Editorial & Hints</h3>
                    {question.hints && question.hints.length > 0 ? (
                      <div className="space-y-4">
                        {question.hints.map((hint: string, idx: number) => (
                          <div key={idx} className="rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-amber-500">Hint {idx + 1}</p>
                            <p className="text-sm text-foreground/90 leading-relaxed">{hint}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/60">No editorial or hints available for this problem.</p>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex-grow min-h-0 overflow-y-auto flex flex-col items-center justify-center"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)" }}
                  >
                    <div className="text-center p-8">
                      <div className="text-4xl mb-3" style={{ opacity: 0.15 }}>📚</div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Community Solutions</p>
                      <p className="text-xs mt-1 text-foreground/60 max-w-sm">Discuss approach, view other submissions, and learn from top answers in the placement hub.</p>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </Group>
        </div>
      )}


    </main>
  );
}

export default function QuestionDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <QuestionDetailPageInner />
    </Suspense>
  );
}

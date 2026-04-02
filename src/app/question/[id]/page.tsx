"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { CodeEditor } from "@/components/coding/CodeEditor";
import { OutputConsole } from "@/components/coding/OutputConsole";
import { QuestionPanel } from "@/components/coding/QuestionPanel";
import { getStarterCodeForQuestion, type CodingQuestion } from "@/lib/codingQuestions";
import { buildSubmissionSkillReport, type SubmissionSkillReport } from "@/lib/submissionSkillReport";
import { saveUserData, supabase } from "@/lib/supabase";

type ExecuteResponse = {
  result: string;
  submitted?: boolean;
  skillReport?: SubmissionSkillReport | null;
  warnings?: string[];
  executionStats?: {
    avgTimeMs: number | null;
    maxTimeMs: number | null;
    avgMemoryKb: number | null;
    maxMemoryKb: number | null;
    measuredCases: number;
  };
  cases: Array<{
    input: string;
    output: string;
    expectedOutput: string;
    status: string;
    passed: boolean;
    timeMs?: number;
    memoryKb?: number;
  }>;
};

type EditableCase = { input: string; expectedOutput: string };

type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const COACH_MAX_HISTORY = 40;

function coachMemoryKey(questionId: string | undefined, userEmail?: string | null) {
  if (!questionId) return null;
  const userPart = String(userEmail || "anon").toLowerCase();
  return `nexthire:coach:${userPart}:${questionId}`;
}

type PerformanceInsights = {
  totalMeasuredRuns: number;
  avgTimeMs: number | null;
  bestTimeMs: number | null;
  avgMemoryKb: number | null;
  bestMemoryKb: number | null;
  timeTrend: "improving" | "stable" | "worse" | "unknown";
  memoryTrend: "improving" | "stable" | "worse" | "unknown";
  currentRunPercentile: {
    time: number | null;
    memory: number | null;
  };
};

const AUX_FETCH_TIMEOUT_MS = 3500;

async function fetchWithTimeout(input: string, signal: AbortSignal, timeoutMs = AUX_FETCH_TIMEOUT_MS) {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  const onAbort = () => timeoutController.abort();
  signal.addEventListener("abort", onAbort, { once: true });

  try {
    return await fetch(input, { signal: timeoutController.signal });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  }
}

export default function QuestionDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);

  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [language, setLanguage] = useState<"cpp" | "java" | "python">("python");
  const [code, setCode] = useState(getStarterCodeForQuestion(null, "python"));

  const [executing, setExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionWarnings, setExecutionWarnings] = useState<string[]>([]);
  const [output, setOutput] = useState<ExecuteResponse | null>(null);
  const [samplesPassed, setSamplesPassed] = useState(false);

  const [activeTab, setActiveTab] = useState<"cases" | "results">("cases");
  const [editableCases, setEditableCases] = useState<EditableCase[]>([]);
  const [editorMaximized, setEditorMaximized] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<CodingQuestion[]>([]);
  const contestId = searchParams?.get("contestId");
  const contestEndsAt = searchParams?.get("contestEndsAt");
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachInput, setCoachInput] = useState("");
  const [coachMessages, setCoachMessages] = useState<CoachChatMessage[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);
  const [solvedBefore, setSolvedBefore] = useState(false);
  const [lastSolvedAt, setLastSolvedAt] = useState<string | null>(null);
  const [restoringAcceptedCode, setRestoringAcceptedCode] = useState(false);
  const coachScrollRef = useRef<HTMLDivElement | null>(null);

  async function trackActivity(activityType: string, payload: Record<string, unknown>) {
    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          source: 'question-page',
          payload,
        }),
      });
    } catch {
      // Ignore tracking failures
    }
  }

  function isContestExpired(): boolean {
    if (!contestId || !contestEndsAt) return false;
    const ends = new Date(contestEndsAt).getTime();
    if (!Number.isFinite(ends)) return false;
    return Date.now() > ends;
  }


  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (restoringAcceptedCode) {
      setRestoringAcceptedCode(false);
      return;
    }
    setCode(getStarterCodeForQuestion(question, language));
  }, [language, question, restoringAcceptedCode]);

  useEffect(() => {
    setSamplesPassed(false);
  }, [code, language, question?.id]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuestion() {
      try {
        setLoadingQuestion(true);
        setQuestionError(null);
        const res = await fetch(`/api/questions/${params.id}`, { signal: controller.signal });
        const data = (await res.json()) as { question?: CodingQuestion; error?: string };
        if (!res.ok || !data.question) throw new Error(data.error || "Question not found");
        setQuestion(data.question);
        setEditableCases((data.question.testcases || []).slice(0, 2).map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })));
        setLoadingQuestion(false);

        // Load non-critical data in parallel after core question content is ready.
        const [progressResult, similarResult] = await Promise.allSettled([
          fetchWithTimeout(`/api/questions/${params.id}/progress`, controller.signal),
          fetchWithTimeout(`/api/questions/similar/${params.id}`, controller.signal),
        ]);

        if (progressResult.status === "fulfilled") {
          const progressRes = progressResult.value;
          const progressData = (await progressRes.json()) as {
            solved?: boolean;
            latestAcceptedCode?: string | null;
            latestAcceptedLanguage?: string | null;
            lastSolvedAt?: string | null;
          };

          if (progressRes.ok) {
            setSolvedBefore(Boolean(progressData.solved));
            setLastSolvedAt(progressData.lastSolvedAt || null);

            const lang = String(progressData.latestAcceptedLanguage || "").toLowerCase();
            const acceptedLanguage = lang === "cpp" || lang === "java" || lang === "python" ? lang : null;
            if (progressData.latestAcceptedCode && acceptedLanguage) {
              setRestoringAcceptedCode(true);
              setLanguage(acceptedLanguage);
              setCode(progressData.latestAcceptedCode);
            }
          }
        }

        if (similarResult.status === "fulfilled") {
          const similarRes = similarResult.value;
          const similarData = (await similarRes.json()) as { similar?: CodingQuestion[] };
          if (similarRes.ok && Array.isArray(similarData.similar)) {
            setSimilarQuestions(similarData.similar);
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setQuestionError(e instanceof Error ? e.message : "Failed to load question");
      } finally {
        setLoadingQuestion(false);
      }
    }

    if (params.id) {
      void loadQuestion();
    }

    return () => controller.abort();
  }, [params.id]);

  const runCases = useMemo(() => {
    if (editableCases.length === 0) return question?.testcases.slice(0, 2) || [];
    return editableCases.filter((tc) => tc.input.trim().length > 0);
  }, [editableCases, question?.testcases]);

  function updateCase(index: number, key: "input" | "expectedOutput", value: string) {
    setEditableCases((prev) => prev.map((tc, idx) => (idx === index ? { ...tc, [key]: value } : tc)));
  }

  function addTestCase() {
    setEditableCases((prev) => [...prev, { input: "", expectedOutput: "" }]);
  }

  async function loadPerformanceInsights(currentStats?: ExecuteResponse["executionStats"]) {
    if (status !== "authenticated" || !session?.user?.email || !params.id) return;

    try {
      const paramsQ = new URLSearchParams();
      if (typeof currentStats?.avgTimeMs === "number") paramsQ.set("currentTimeMs", String(currentStats.avgTimeMs));
      if (typeof currentStats?.avgMemoryKb === "number") paramsQ.set("currentMemoryKb", String(currentStats.avgMemoryKb));

      const suffix = paramsQ.toString() ? `?${paramsQ.toString()}` : "";
      const res = await fetch(`/api/questions/${params.id}/performance${suffix}`);
      const data = (await res.json().catch(() => ({}))) as { insights?: PerformanceInsights };
      if (!res.ok) return;
      setPerformanceInsights(data.insights || null);
    } catch {
      // Ignore optional insights errors
    }
  }

  useEffect(() => {
    if (!question?.title) return;
    const key = coachMemoryKey(question.id, session?.user?.email);
    const welcome: CoachChatMessage = {
      role: "assistant",
      content: `Nicee, let's work on ${question.title}. Ask anything: explain, hints, edge cases, topic revision, interview guidance, or full implementation.`,
    };

    if (key) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CoachChatMessage[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCoachMessages(
              parsed
                .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
                .slice(-COACH_MAX_HISTORY)
            );
          } else {
            setCoachMessages([welcome]);
          }
        } else {
          setCoachMessages([welcome]);
        }
      } catch {
        setCoachMessages([welcome]);
      }
    } else {
      setCoachMessages([welcome]);
    }

    setCoachError(null);
    setCoachInput("");
  }, [question?.id, question?.title, session?.user?.email]);

  useEffect(() => {
    const key = coachMemoryKey(question?.id, session?.user?.email);
    if (!key || coachMessages.length === 0) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(coachMessages.slice(-COACH_MAX_HISTORY)));
    } catch {
      // Ignore storage quota/errors.
    }
  }, [coachMessages, question?.id, session?.user?.email]);

  useEffect(() => {
    if (!coachOpen) return;
    coachScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [coachMessages, coachLoading, coachOpen]);

  async function sendCoachMessage(inputText: string) {
    if (!question) return;
    const prompt = inputText.trim();
    if (!prompt || coachLoading) return;

    const userMessage: CoachChatMessage = { role: "user", content: prompt };
    const nextMessages = [...coachMessages, userMessage].slice(-COACH_MAX_HISTORY);

    try {
      setCoachLoading(true);
      setCoachError(null);
      setCoachOpen(true);
      setCoachMessages(nextMessages);
      setCoachInput("");

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          messages: nextMessages,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!res.ok) throw new Error(data.error || "Failed to load AI coaching");

      const assistantMessage: CoachChatMessage = {
        role: "assistant",
        content: String(data.message || "I could not generate a response."),
      };
      setCoachMessages((prev) => [...prev, assistantMessage].slice(-COACH_MAX_HISTORY));

      void trackActivity('ai_coach_query', {
        questionId: question.id,
        questionTitle: question.title,
        query: prompt.slice(0, 1000),
        responseLength: assistantMessage.content.length,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load AI coaching";
      setCoachError(message);
      const failureMsg: CoachChatMessage = { role: "assistant", content: `I hit an issue: ${message}` };
      setCoachMessages((prev) => {
        const merged: CoachChatMessage[] = [...prev, failureMsg];
        return merged.slice(-COACH_MAX_HISTORY);
      });
    } finally {
      setCoachLoading(false);
    }
  }

  async function runCode() {
    if (!question) return;

    if (isContestExpired()) {
      setExecutionError("Your contest time has exceeded. Execution is locked for this round.");
      setActiveTab("results");
      return;
    }

    try {
      setExecuting(true);
      setExecutionError(null);
      setExecutionWarnings([]);

      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          testcases: runCases,
          functionName: question.function_name,
          inputType: question.input_type,
          outputType: question.output_type,
          submit: false,
        }),
      });

      const data = (await res.json()) as ExecuteResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Execution failed");
      setOutput({ result: data.result, cases: data.cases, skillReport: null, executionStats: data.executionStats, submitted: false });
      void loadPerformanceInsights(data.executionStats);
      setExecutionWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setSamplesPassed(data.cases.every((c) => c.passed));
      setActiveTab("results");

      void trackActivity('question_run', {
        questionId: question.id,
        questionTitle: question.title,
        language,
        cases: Array.isArray(data.cases) ? data.cases.length : 0,
        passedCases: Array.isArray(data.cases) ? data.cases.filter((c) => c.passed).length : 0,
      });
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : "Execution failed");
      setActiveTab("results");
    } finally {
      setExecuting(false);
    }
  }

  async function submitCode() {
    if (!question) return;

    if (isContestExpired()) {
      setExecutionError("Your time exceeded for this contest. Submission failed.");
      setActiveTab("results");
      return;
    }

    if (!samplesPassed) {
      setExecutionError("Please run and pass your test cases before submitting.");
      setActiveTab("results");
      return;
    }

    try {
      setExecuting(true);
      setExecutionError(null);
      setExecutionWarnings([]);

      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          testcases: question.testcases,
          functionName: question.function_name,
          inputType: question.input_type,
          outputType: question.output_type,
          submit: true,
        }),
      });

      const data = (await res.json()) as ExecuteResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Execution failed");
      const skillReport = buildSubmissionSkillReport(question, code, language, data.cases || []);
      setOutput({ result: data.result, cases: data.cases, skillReport, executionStats: data.executionStats, submitted: true });
      void loadPerformanceInsights(data.executionStats);
      setExecutionWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setActiveTab("results");

      void trackActivity('question_submit', {
        questionId: question.id,
        questionTitle: question.title,
        language,
        accepted: data.cases.every((c) => c.passed),
        totalCases: Array.isArray(data.cases) ? data.cases.length : 0,
      });

      const allPassed = data.cases.every((c) => c.passed);
      if (allPassed && status === "authenticated" && session?.user?.email) {
        await saveUserData({ name: session.user?.name ?? null, email: session.user.email });
        const { data: userRow } = await supabase.from("users").select("id").eq("email", session.user.email).maybeSingle();

        if (userRow?.id) {
          await supabase.from("submissions").insert({
            user_id: userRow.id,
            language,
            code,
            output: data.result,
            feedback: JSON.stringify({
              type: "problem_submission",
              perCase: data.cases.map((c) => ({ status: c.status, passed: c.passed })),
              skillReport,
              executionStats: data.executionStats || null,
            }),
            difficulty: question.difficulty.toLowerCase(),
            question_id: question.id,
            result: data.result,
            contest_id: contestId ?? null,
          });
        }
      }
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <main className={`h-[calc(100vh-6rem)] overflow-hidden px-3 pb-3 md:px-4 ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"}`}>
      <div className="mb-2 flex items-center justify-between">
        <Link href="/coding" className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? "border-white/20 bg-white/8 hover:bg-white/15" : "border-black/15 bg-white hover:bg-black/5"}`}>
          Back To Questions
        </Link>
      </div>

      {loadingQuestion && <p className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Loading question...</p>}
      {questionError && <p className={`text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>{questionError}</p>}

      {!loadingQuestion && question && (
        <Group orientation="horizontal" className="h-[calc(100%-2.5rem)] rounded-2xl border border-white/10">
          {!editorMaximized && (
            <>
              <Panel defaultSize={40} minSize={28}>
                <QuestionPanel question={question} isDark={isDark} similarQuestions={similarQuestions} />
              </Panel>

              <Separator className={`${isDark ? "bg-white/10 hover:bg-white/25" : "bg-black/10 hover:bg-black/25"} w-1 transition-colors`} />
            </>
          )}

          <Panel defaultSize={editorMaximized ? 100 : 60} minSize={35}>
            <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
              {solvedBefore && (
                <div className={`mb-2 rounded-xl border px-3 py-2 text-xs ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/15 bg-black/5 text-black"}`}>
                  Solved previously. Loaded your latest accepted submission.
                  {lastSolvedAt && <span> Last solved: {new Date(lastSolvedAt).toLocaleString()}</span>}
                </div>
              )}
              <div className={`sticky top-0 z-20 mb-3 rounded-xl border px-3 py-2 backdrop-blur ${isDark ? "border-white/10 bg-black/50" : "border-black/10 bg-white/80"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "cpp" | "java" | "python")}
                    className={`rounded-lg border px-3 py-1.5 text-sm outline-none ${isDark ? "border-white/15 bg-black/40" : "border-black/15 bg-white"}`}
                  >
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                  </select>

                  <button onClick={() => void runCode()} disabled={executing} className={`rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-60 ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}>
                    {executing ? "Running..." : "Run"}
                  </button>

                  <button onClick={() => void submitCode()} disabled={executing} className={`rounded-lg border px-4 py-1.5 text-sm font-semibold disabled:opacity-60 ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-white text-black hover:bg-black/5"}`}>
                    Submit
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoachOpen((prev) => !prev)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
                  >
                    {coachOpen ? "Close AI Coach" : "Open AI Coach"}
                  </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditorMaximized((prev) => !prev)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${isDark ? "border-white/20 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/20 bg-white text-black/80 hover:bg-black/5"}`}
                  >
                    <span>{editorMaximized ? "Show Question" : "Maximize Editor"}</span>
                  </button>
                </div>

              </div>

              <Group orientation="vertical" className="mt-3 min-h-0 flex-1">
                <Panel defaultSize={62} minSize={35}>
                  <div className="h-full min-h-40 rounded-xl border border-white/10">
                    <CodeEditor isDark={isDark} language={language} code={code} onChange={setCode} />
                  </div>
                </Panel>

                <Separator className={`${isDark ? "bg-white/10 hover:bg-white/25" : "bg-black/10 hover:bg-black/25"} h-1 transition-colors`} />

                <Panel defaultSize={38} minSize={20}>
                  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10">
                    <div className={`flex border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
                      <button
                        type="button"
                        onClick={() => setActiveTab("cases")}
                        className={`px-4 py-2 text-sm font-semibold ${activeTab === "cases" ? (isDark ? "bg-white/15 text-white" : "bg-black/10 text-black") : (isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/5")}`}
                      >
                        Test Cases
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("results")}
                        className={`px-4 py-2 text-sm font-semibold ${activeTab === "results" ? (isDark ? "bg-white/15 text-white" : "bg-black/10 text-black") : (isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/5")}`}
                      >
                        Test Results
                      </button>
                    </div>

                    {activeTab === "cases" && (
                      <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className={`text-xs ${isDark ? "text-white/65" : "text-black/65"}`}>Add custom test cases and run instantly</p>
                          <button
                            type="button"
                            onClick={addTestCase}
                            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-black/5 text-black hover:bg-black/10"}`}
                          >
                            Add Test Case
                          </button>
                        </div>

                        <div className="space-y-3">
                          {editableCases.map((tc, idx) => (
                            <div key={`case-${idx}`} className={`rounded-lg border p-2 ${isDark ? "border-white/10 bg-black/35" : "border-black/10 bg-black/5"}`}>
                              <p className={`mb-1 text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>Case {idx + 1}</p>
                              <textarea
                                rows={3}
                                value={tc.input}
                                onChange={(e) => updateCase(idx, "input", e.target.value)}
                                placeholder="Input"
                                className={`mb-2 w-full rounded-md border px-2 py-1 text-xs outline-none ${isDark ? "border-white/15 bg-black/45 text-white" : "border-black/15 bg-white text-black"}`}
                              />
                              <textarea
                                rows={2}
                                value={tc.expectedOutput}
                                onChange={(e) => updateCase(idx, "expectedOutput", e.target.value)}
                                placeholder="Expected output"
                                className={`w-full rounded-md border px-2 py-1 text-xs outline-none ${isDark ? "border-white/15 bg-black/45 text-white" : "border-black/15 bg-white text-black"}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "results" && (
                      <div className="min-h-0 flex-1 p-2">
                        <OutputConsole isDark={isDark} loading={executing} result={output} error={executionError} performanceInsights={performanceInsights} />
                        {executionWarnings.length > 0 && (
                          <div className={`mt-2 rounded-lg border p-2 text-xs ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/15 bg-black/5 text-black"}`}>
                            {executionWarnings.map((warning, idx) => (
                              <p key={`warn-${idx}`}>- {warning}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Panel>
              </Group>
            </div>
          </Panel>
        </Group>
      )}

      {coachOpen && (
        <div className="fixed inset-0 z-140 bg-black/60 backdrop-blur-sm p-3 md:p-6">
          <div className={`mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border shadow-2xl ${isDark ? "border-white/20 bg-black/80 text-white backdrop-blur-xl" : "border-black/15 bg-white/80 text-black backdrop-blur-xl"}`}>
            <div className={`flex items-center justify-between border-b px-4 py-3 md:px-6 ${isDark ? "border-white/10" : "border-black/10"}`}>
              <div>
                <h2 className="text-lg font-semibold md:text-2xl">AI Coach</h2>
                <p className={`text-xs md:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                  Learn clearly with explanation, real hints, test cases, and topic revision.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoachOpen(false)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold md:text-sm ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
              >
                Back To Code
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:grid-cols-[340px_1fr] md:p-6">
              <aside className={`min-h-0 overflow-y-auto rounded-xl border p-4 shadow-sm ${isDark ? "border-white/15 bg-white/10" : "border-black/10 bg-white/60"}`}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-white/75" : "text-black/75"}`}>
                  Quick Actions
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => void sendCoachMessage("Explain this problem in simple terms with intuition and approach.")}
                    disabled={coachLoading}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-60 ${isDark ? "border-white/20 bg-black/45 text-white hover:bg-black/60" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
                  >
                    Explain Question
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendCoachMessage("Give progressive hints only. Do not reveal final answer.")}
                    disabled={coachLoading}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-60 ${isDark ? "border-white/20 bg-black/45 text-white hover:bg-black/60" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
                  >
                    Hints
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendCoachMessage("Give 3 extra test cases with expected output and why each case matters.")}
                    disabled={coachLoading}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-60 ${isDark ? "border-white/20 bg-black/45 text-white hover:bg-black/60" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
                  >
                    Extra Test Cases
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendCoachMessage("Give a topic overview for concepts used in this question with common mistakes.")}
                    disabled={coachLoading}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-60 ${isDark ? "border-white/20 bg-black/45 text-white hover:bg-black/60" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
                  >
                    Topic Overview
                  </button>
                </div>

                <p className={`mt-4 text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
                  GPT-style chat tutor focused on real explanations using your current question context.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const key = coachMemoryKey(question?.id, session?.user?.email);
                    if (key) {
                      try {
                        window.localStorage.removeItem(key);
                      } catch {
                        // Ignore storage errors.
                      }
                    }
                    if (question?.title) {
                      setCoachMessages([
                        {
                          role: "assistant",
                          content: `Chat reset for ${question.title}. Ask anything and I will guide step-by-step.`,
                        },
                      ]);
                    } else {
                      setCoachMessages([]);
                    }
                  }}
                  className={`mt-3 w-full rounded-xl border px-3 py-2 text-left text-sm ${isDark ? "border-white/20 bg-black/45 text-white hover:bg-black/60" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
                >
                  Clear Chat Memory
                </button>
              </aside>

              <section className={`flex min-h-0 flex-col rounded-xl border shadow-sm ${isDark ? "border-white/15 bg-white/8" : "border-black/10 bg-white/70"}`}>
                <div className={`border-b px-4 py-3 text-xs ${isDark ? "border-white/10 text-white/75" : "border-black/10 text-black/75"}`}>
                  Ask freely like ChatGPT. This chat automatically uses the current question context.
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {coachMessages.map((msg, idx) => (
                    <div key={`coach-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-6 ${
                          msg.role === "user"
                            ? isDark
                              ? "border border-white/25 bg-white text-black"
                              : "border border-black/20 bg-black text-white"
                            : isDark
                            ? "border border-white/20 bg-black/55 text-white"
                            : "border border-black/15 bg-white text-black"
                        }`}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                      </div>
                    </div>
                  ))}

                  {coachLoading && (
                    <div className="flex justify-start">
                      <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-white/20 bg-black/55 text-white" : "border-black/15 bg-white text-black"}`}>
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={coachScrollRef} />
                </div>

                {coachError && (
                  <div className={`px-4 pb-2 text-xs ${isDark ? "text-white/80" : "text-black/80"}`}>{coachError}</div>
                )}

                <div className={`border-t p-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <div className="flex gap-2">
                    <textarea
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void sendCoachMessage(coachInput);
                        }
                      }}
                      rows={2}
                      placeholder="Ask anything about this question..."
                      disabled={coachLoading}
                      className={`flex-1 resize-none rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? "border-white/20 bg-black/45 text-white placeholder:text-white/50" : "border-black/20 bg-white text-black placeholder:text-black/45"}`}
                    />
                    <button
                      type="button"
                      onClick={() => void sendCoachMessage(coachInput)}
                      disabled={coachLoading || !coachInput.trim()}
                      className={`rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60 ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                    >
                      {coachLoading ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

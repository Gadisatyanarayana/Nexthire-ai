"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Clock, Cpu, Eye, EyeOff, ChevronDown, ChevronRight, Lock, Zap, Database, AlertTriangle, Info } from "lucide-react";
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type CaseResult = {
  input: string;
  output: string;
  expectedOutput: string;
  status: string;
  passed: boolean;
  isHidden?: boolean;
  timeMs?: number;
  memoryKb?: number;
};

type ExecutionStats = {
  avgTimeMs: number | null;
  maxTimeMs: number | null;
  avgMemoryKb: number | null;
  maxMemoryKb: number | null;
  measuredCases: number;
};

type SkillReport = {
  approachQuality: number;
  optimizationQuality: number;
  edgeCaseQuality: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  nextPractice: string[];
};

type ComplexityWarning = {
  severity: "info" | "warning" | "danger";
  message: string;
};

type ComplexityInfo = {
  timeComplexity: string;
  spaceComplexity: string;
  warnings: ComplexityWarning[];
  isRecursive: boolean;
  maxLoopDepth: number;
  details: string;
};

type Props = {
  isDark: boolean;
  loading: boolean;
  result: {
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
    cases: CaseResult[];
    aiFeedback?: string | null;
    diagnostics?: Array<{
      line: number;
      column?: number;
      severity: "error" | "warning" | "note";
      message: string;
      source: "compile" | "runtime";
    }>;
    executionStats?: ExecutionStats | null;
    assessment?: {
      mode: "platform" | "custom";
      source: string;
      sample: { total: number; passed: number; failed: number };
      hidden: { total: number; passed: number; failed: number };
    } | null;
    skillReport?: SkillReport | null;
    complexity?: ComplexityInfo | null;
  } | null;
  error: string | null;
  performanceInsights?: {
    currentRunPercentile: { time: number | null; memory: number | null };
  } | null;
};

function StatusBadge({ status, passed }: { status: string; passed: boolean }) {
  const isAccepted = status === "Accepted" || passed;
  const isTLE = status === "Time Limit Exceeded";
  const isCompile = status === "Compile Error";

  if (isAccepted) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(0,184,163,0.15)", color: "var(--color-accepted)", border: "1px solid rgba(0,184,163,0.25)" }}
      >
        <CheckCircle2 style={{ width: 12, height: 12 }} />
        {status}
      </span>
    );
  }

  if (isTLE) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(255,161,22,0.15)", color: "var(--color-tle)", border: "1px solid rgba(255,161,22,0.25)" }}
      >
        <Clock style={{ width: 12, height: 12 }} />
        {status}
      </span>
    );
  }

  if (isCompile) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(239,71,67,0.15)", color: "var(--color-wrong)", border: "1px solid rgba(239,71,67,0.25)" }}
      >
        <XCircle style={{ width: 12, height: 12 }} />
        {status}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(239,71,67,0.15)", color: "var(--color-wrong)", border: "1px solid rgba(239,71,67,0.25)" }}
    >
      <XCircle style={{ width: 12, height: 12 }} />
      {status}
    </span>
  );
}

function CaseCard({
  caseResult,
  index,
  isSubmit,
  defaultOpen,
}: {
  caseResult: CaseResult;
  index: number;
  isSubmit: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? !caseResult.passed);

  if (caseResult.isHidden && isSubmit) {
    return (
      <div
        className="rounded-lg px-4 py-3 flex items-center gap-3"
        style={{
          background: caseResult.passed
            ? "rgba(0,184,163,0.05)"
            : "rgba(239,71,67,0.05)",
          border: `1px solid ${caseResult.passed ? "rgba(0,184,163,0.15)" : "rgba(239,71,67,0.15)"}`,
        }}
      >
        <Lock style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Hidden Test Case {index + 1}
        </span>
        {caseResult.passed ? (
          <CheckCircle2 className="ml-auto" style={{ width: 14, height: 14, color: "var(--color-accepted)", flexShrink: 0 }} />
        ) : (
          <XCircle className="ml-auto" style={{ width: 14, height: 14, color: "var(--color-wrong)", flexShrink: 0 }} />
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: `1px solid ${caseResult.passed ? "rgba(0,184,163,0.2)" : "rgba(239,71,67,0.2)"}`,
        background: caseResult.passed
          ? "rgba(0,184,163,0.04)"
          : "rgba(239,71,67,0.04)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        style={{ background: "transparent" }}
      >
        {open ? (
          <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
        ) : (
          <ChevronRight style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
        )}
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Case {index + 1}
        </span>
        {caseResult.isHidden && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
            HIDDEN
          </span>
        )}
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1" style={{
          background: caseResult.passed ? "rgba(0,184,163,0.15)" : "rgba(239,71,67,0.15)",
          color: caseResult.passed ? "var(--color-accepted)" : "var(--color-wrong)",
        }}>
          {caseResult.status}
        </span>
        {typeof caseResult.timeMs === "number" && (
          <span className="text-[11px] ml-auto" style={{ color: "var(--text-muted)" }}>
            {caseResult.timeMs} ms
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Input</p>
            <pre
              className="text-xs rounded-md px-3 py-2 overflow-x-auto"
              style={{ background: "var(--surface-inset)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
            >
              {caseResult.input || "(empty)"}
            </pre>
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Output</p>
            <pre
              className="text-xs rounded-md px-3 py-2 overflow-x-auto"
              style={{ background: "var(--surface-inset)", color: caseResult.passed ? "var(--color-accepted)" : "var(--color-wrong)", border: `1px solid ${caseResult.passed ? "rgba(0,184,163,0.2)" : "rgba(239,71,67,0.2)"}`, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
            >
              {caseResult.output || "(empty)"}
            </pre>
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Expected</p>
            <pre
              className="text-xs rounded-md px-3 py-2 overflow-x-auto"
              style={{ background: "var(--surface-inset)", color: "var(--color-accepted)", border: "1px solid rgba(0,184,163,0.15)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
            >
              {isSubmit && caseResult.isHidden ? "[Hidden]" : (caseResult.expectedOutput || "(empty)")}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Complexity Panel ─────────────────────────────────────────────────────────

function ComplexityBadge({ label, value }: { label: string; value: string }) {
  const isExpensive = value.includes("N²") || value.includes("N³") || value.includes("2^N") || value.includes("N!");
  const isModerate = value.includes("N log") || value.includes("N)");
  const color = isExpensive
    ? "var(--color-wrong)"
    : isModerate
    ? "var(--color-tle)"
    : "var(--color-accepted)";
  const bg = isExpensive
    ? "rgba(239,71,67,0.1)"
    : isModerate
    ? "rgba(255,161,22,0.1)"
    : "rgba(0,184,163,0.1)";
  const border = isExpensive
    ? "rgba(239,71,67,0.25)"
    : isModerate
    ? "rgba(255,161,22,0.25)"
    : "rgba(0,184,163,0.25)";

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span className="text-[11px] uppercase font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-sm font-bold font-mono ml-auto" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function ComplexityPanel({ complexity }: { complexity: ComplexityInfo }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const dangerWarnings = complexity.warnings.filter((w) => w.severity === "danger");
  const warnWarnings = complexity.warnings.filter((w) => w.severity === "warning");
  const infoWarnings = complexity.warnings.filter((w) => w.severity === "info");

  return (
    <div
      className="rounded-xl p-3 mb-3"
      style={{
        background: "rgba(163,113,247,0.06)",
        border: "1px solid rgba(163,113,247,0.18)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 350ms ease, transform 350ms ease",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap style={{ width: 13, height: 13, color: "var(--brand-purple)" }} />
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--brand-purple)" }}>
          Complexity Analysis
        </p>
        {complexity.isRecursive && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-auto"
            style={{ background: "rgba(163,113,247,0.15)", color: "var(--brand-purple)", border: "1px solid rgba(163,113,247,0.25)" }}
          >
            RECURSIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <ComplexityBadge label="⏱ Time" value={complexity.timeComplexity} />
        <ComplexityBadge label="📦 Space" value={complexity.spaceComplexity} />
      </div>

      {complexity.warnings.length > 0 && (
        <div className="space-y-1.5">
          {[...dangerWarnings, ...warnWarnings, ...infoWarnings].map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs"
              style={{
                background: w.severity === "danger"
                  ? "rgba(239,71,67,0.08)"
                  : w.severity === "warning"
                  ? "rgba(255,161,22,0.08)"
                  : "rgba(88,166,255,0.08)",
                border: `1px solid ${
                  w.severity === "danger"
                    ? "rgba(239,71,67,0.2)"
                    : w.severity === "warning"
                    ? "rgba(255,161,22,0.2)"
                    : "rgba(88,166,255,0.2)"
                }`,
              }}
            >
              {w.severity === "danger" ? (
                <AlertTriangle style={{ width: 12, height: 12, color: "var(--color-wrong)", flexShrink: 0, marginTop: 1 }} />
              ) : w.severity === "warning" ? (
                <AlertTriangle style={{ width: 12, height: 12, color: "var(--color-tle)", flexShrink: 0, marginTop: 1 }} />
              ) : (
                <Info style={{ width: 12, height: 12, color: "var(--brand-blue)", flexShrink: 0, marginTop: 1 }} />
              )}
              <span style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>{w.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

export function OutputConsole({ isDark, loading, result, error, performanceInsights }: Props) {
  const [showCases, setShowCases] = useState(true);
  const [animatingCount, setAnimatingCount] = useState(0);
  // Loading phase: 0=idle, 1=compiling, 2=executing
  const [loadPhase, setLoadPhase] = useState(0);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) {
      setLoadPhase(1);
      phaseTimerRef.current = setTimeout(() => setLoadPhase(2), 1400);
    } else {
      setLoadPhase(0);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    }
    return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); };
  }, [loading]);

  useEffect(() => {
    if (!result || !result.cases || result.cases.length === 0) {
      setAnimatingCount(0);
      return;
    }
    const total = result.cases.length;
    setAnimatingCount(0);
    const interval = setInterval(() => {
      setAnimatingCount((prev) => {
        if (prev >= total) {
          clearInterval(interval);
          return total;
        }
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [result]);

  const animatedCases = result?.cases?.slice(0, animatingCount) ?? [];
  const isAnimating = Boolean(result && result.cases && result.cases.length > 0 && animatingCount < result.cases.length);

  const totalCases = typeof result?.total === "number" ? result.total : result?.cases?.length ?? 0;
  
  const passedCasesCount = animatedCases.filter((item) => item.passed).length;
  const passedCases = isAnimating ? passedCasesCount : (typeof result?.passed === "number" ? result.passed : result?.cases?.filter((item) => item.passed).length ?? 0);
  
  const hiddenTotal = result?.assessment?.hidden?.total ?? result?.cases?.filter((c) => c.isHidden).length ?? 0;
  const hiddenPassed = isAnimating ? animatedCases.filter((c) => c.isHidden && c.passed).length : (result?.assessment?.hidden?.passed ?? result?.cases?.filter((c) => c.isHidden && c.passed).length ?? 0);
  
  const sampleTotal = result?.assessment?.sample?.total ?? result?.cases?.filter((c) => !c.isHidden).length ?? 0;
  const samplePassed = isAnimating ? animatedCases.filter((c) => !c.isHidden && c.passed).length : (result?.assessment?.sample?.passed ?? result?.cases?.filter((c) => !c.isHidden && c.passed).length ?? 0);
  
  const visibleCases = animatedCases.filter((c) => !c.isHidden || !result?.submitted);
  const hiddenCases = animatedCases.filter((c) => c.isHidden);

  const rawStatus = String(result?.result || "").trim();
  const normalizedStatus = isAnimating ? "Judging..." : rawStatus;
  const isAccepted = !isAnimating && rawStatus.toLowerCase() === "accepted" && passedCases === totalCases && totalCases > 0;
  const isTLE = !isAnimating && rawStatus === "Time Limit Exceeded";
  const isCompile = !isAnimating && rawStatus === "Compile Error";
  const allPassed = !isAnimating && totalCases > 0 && passedCases === totalCases;

  const avgTime = result?.executionStats?.avgTimeMs ?? null;
  const avgMem = result?.executionStats?.avgMemoryKb ?? null;
  const runtimeLabel = result?.runtime || (typeof avgTime === "number" ? `${avgTime.toFixed(1)} ms` : null);
  const memoryLabel = result?.memory || (typeof avgMem === "number" ? `${(avgMem / 1024).toFixed(2)} MB` : null);

  const timePercentile = performanceInsights?.currentRunPercentile?.time ?? null;
  const memPercentile = performanceInsights?.currentRunPercentile?.memory ?? null;

  if (loading) {
    const phaseLabel = loadPhase === 1 ? "Compiling code…" : "Executing test cases…";
    const phaseIcon = loadPhase === 1 ? "⚙️" : "⚡";
    return (
      <div className="h-full flex items-center justify-center gap-4 flex-col" style={{ padding: "24px" }}>
        <div className="relative" style={{ width: 40, height: 40 }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            {phaseIcon}
          </span>
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            className="text-sm font-semibold"
            key={phaseLabel}
            style={{
              color: "var(--text-primary)",
              animation: "fadeSlideIn 300ms ease",
            }}
          >
            {phaseLabel}
          </p>
          <div className="flex items-center gap-1.5 justify-center mt-2">
            {[1, 2].map((step) => (
              <div
                key={step}
                style={{
                  width: step <= loadPhase ? 20 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: step <= loadPhase
                    ? "var(--brand-green)"
                    : "var(--border-primary)",
                  transition: "all 400ms ease",
                }}
              />
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>This may take a few seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(239,71,67,0.1)", border: "1px solid rgba(239,71,67,0.25)", color: "var(--color-wrong)" }}
        >
          <p className="font-semibold mb-1">Execution Error</p>
          <p className="text-xs opacity-90 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-3 text-center"
        style={{ padding: "32px" }}
      >
        <div style={{ fontSize: 40, opacity: 0.15 }}>⚡</div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Run your code to see results
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Click Run to test with sample cases, or Submit to evaluate against all test cases
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: "12px" }}>

        {/* Result banner with entrance animation */}
        <div
          className={`rounded-xl p-4 mb-3 result-flash ${
            isAnimating
              ? "result-judging"
              : isAccepted
              ? "result-accepted"
              : isTLE
              ? "result-tle"
              : "result-wrong"
          }`}
          style={{
            animation: "verdictEnter 350ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isAnimating ? (
                  <div className="spinner animate-spin" style={{ width: 18, height: 18, borderTopColor: "var(--brand-blue)" }} />
                ) : isAccepted ? (
                  <CheckCircle2 style={{ width: 22, height: 22, color: "var(--color-accepted)" }} />
                ) : (
                  <XCircle style={{ width: 22, height: 22, color: isTLE ? "var(--color-tle)" : "var(--color-wrong)" }} />
                )}
                <span
                  className="text-lg font-bold"
                  style={{
                    color: isAnimating
                      ? "var(--text-primary)"
                      : isAccepted
                      ? "var(--color-accepted)"
                      : isTLE
                      ? "var(--color-tle)"
                      : "var(--color-wrong)",
                  }}
                >
                  {normalizedStatus || (allPassed ? "Accepted" : "Wrong Answer")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {passedCases}/{totalCases} test cases passed
                </span>
                {hiddenTotal > 0 && result.submitted && (
                  <>
                    <span style={{ color: "var(--border-accent)" }}>·</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Sample: {samplePassed}/{sampleTotal}
                    </span>
                    <span style={{ color: "var(--border-accent)" }}>·</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                      <Lock style={{ width: 10, height: 10 }} />
                      Hidden: {hiddenPassed}/{hiddenTotal}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Runtime & Memory stats */}
        {(runtimeLabel || memoryLabel) && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {runtimeLabel && (
              <div
                className="rounded-lg p-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
                  <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>Runtime</p>
                </div>
                <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{runtimeLabel}</p>
                {typeof timePercentile === "number" && (
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--color-accepted)" }}>
                    Beats {timePercentile.toFixed(1)}% of users
                  </p>
                )}
              </div>
            )}
            {memoryLabel && (
              <div
                className="rounded-lg p-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Cpu style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
                  <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>Memory</p>
                </div>
                <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{memoryLabel}</p>
                {typeof memPercentile === "number" && (
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--color-accepted)" }}>
                    Beats {memPercentile.toFixed(1)}% of users
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Runtime & Space Complexity Distribution Graphs removed from here (now in left panel Submissions tab) */}

        {/* Failed hidden case info */}
        {result.submitted && !isAccepted && result.failedInput && !String(result.failedInput).includes("Hidden") && (
          <div
            className="rounded-lg p-3 mb-3"
            style={{ background: "rgba(255,161,22,0.06)", border: "1px solid rgba(255,161,22,0.2)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-tle)" }}>
              First Failed Input
            </p>
            <pre className="text-xs font-mono overflow-x-auto" style={{ color: "var(--text-primary)" }}>
              {result.failedInput}
            </pre>
          </div>
        )}

        {/* Diagnostics */}
        {Array.isArray(result.diagnostics) && result.diagnostics.length > 0 && (
          <div
            className="rounded-lg p-3 mb-3"
            style={{ background: "rgba(239,71,67,0.06)", border: "1px solid rgba(239,71,67,0.2)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-wrong)" }}>
              Compiler Diagnostics
            </p>
            <div className="space-y-1.5">
              {result.diagnostics.slice(0, 6).map((diag, idx) => (
                <div
                  key={`diag-${idx}`}
                  className="text-xs font-mono rounded px-2 py-1.5"
                  style={{
                    background: "var(--surface-inset)",
                    color: diag.severity === "warning" ? "var(--color-tle)" : "var(--color-wrong)",
                    border: `1px solid ${diag.severity === "warning" ? "rgba(255,161,22,0.15)" : "rgba(239,71,67,0.15)"}`,
                  }}
                >
                  <span className="font-semibold uppercase">[{diag.severity}]</span> Line {diag.line}
                  {typeof diag.column === "number" && `:${diag.column}`} — {diag.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complexity Analysis Panel */}
        {result.complexity && (
          <ComplexityPanel complexity={result.complexity} />
        )}

        {/* Test cases section */}
        {result.cases.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowCases((v) => !v)}
              className="flex items-center gap-2 mb-2 w-full text-left"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              {showCases ? (
                <EyeOff style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
              ) : (
                <Eye style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Test Cases ({passedCases}/{totalCases} passed)
              </span>
              {hiddenTotal > 0 && result.submitted && (
                <span className="ml-2 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <Lock style={{ width: 10, height: 10 }} />
                  {hiddenTotal} hidden
                </span>
              )}
            </button>

            {showCases && (
              <div className="space-y-2">
                {/* Visible cases */}
                {visibleCases.map((c, idx) => (
                  <CaseCard
                    key={`vis-${idx}`}
                    caseResult={c}
                    index={idx}
                    isSubmit={Boolean(result.submitted)}
                    defaultOpen={!c.passed && idx === visibleCases.findIndex((x) => !x.passed)}
                  />
                ))}

                {/* Hidden cases (when submitted) */}
                {result.submitted && hiddenCases.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 my-2">
                      <div style={{ flex: 1, height: 1, background: "var(--border-primary)" }} />
                      <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <Lock style={{ width: 10, height: 10 }} />
                        {hiddenCases.length} Hidden Test Cases
                      </span>
                      <div style={{ flex: 1, height: 1, background: "var(--border-primary)" }} />
                    </div>
                    {hiddenCases.map((c, idx) => (
                      <CaseCard
                        key={`hidden-${idx}`}
                        caseResult={c}
                        index={visibleCases.length + idx}
                        isSubmit={true}
                        defaultOpen={false}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Feedback */}
        {result.submitted && result.result === "Accepted" && result.aiFeedback && (
          <div
            className="rounded-lg p-3 mt-3"
            style={{ background: "rgba(163,113,247,0.08)", border: "1px solid rgba(163,113,247,0.2)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--brand-purple)" }}>
              AI Enhancement Review
            </p>
            <pre className="text-xs leading-6 whitespace-pre-wrap" style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
              {result.aiFeedback}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

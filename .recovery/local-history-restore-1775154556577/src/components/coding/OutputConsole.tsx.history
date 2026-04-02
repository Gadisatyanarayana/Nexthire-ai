"use client";

type CaseResult = {
  input: string;
  output: string;
  expectedOutput: string;
  status: string;
  passed: boolean;
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

type SkillReport = {
  approachQuality: number;
  optimizationQuality: number;
  edgeCaseQuality: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  nextPractice: string[];
};

type Props = {
  isDark: boolean;
  loading: boolean;
  result: {
    result: string;
    submitted?: boolean;
    cases: CaseResult[];
    executionStats?: ExecutionStats;
    skillReport?: SkillReport | null;
  } | null;
  error: string | null;
  performanceInsights?: PerformanceInsights | null;
};

export function OutputConsole({ isDark, loading, result, error, performanceInsights }: Props) {
  const resultTone = result?.result === "Accepted"
    ? (isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700")
    : result?.result === "Compile Error" || result?.result === "Runtime Error"
      ? (isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700")
      : (isDark ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700");

  return (
    <div className={`flex h-full min-h-0 flex-col rounded-2xl border p-4 backdrop-blur-lg ${isDark ? "border-white/10 bg-black/70" : "border-black/10 bg-white"}`}>
      <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${isDark ? "text-white/80" : "text-black/75"}`}>Output Console</h3>

      {loading && <p className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Executing code...</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}

      {!loading && !error && !result && <p className={`text-sm ${isDark ? "text-white/60" : "text-black/65"}`}>Run or submit code to see results.</p>}

      {!loading && !error && result && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${result.result === "Accepted" ? "text-emerald-300" : "text-rose-300"}`}>
              Result:
            </p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resultTone}`}>
              {result.result}
            </span>
          </div>

          {result.cases.map((item, idx) => (
            <div key={`case-${idx}`} className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-black/50" : "border-black/10 bg-black/5"}`}>
              <p className={`mb-1 text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>Test Case {idx + 1}</p>
              <p className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>Input</p>
              <pre className={`mb-2 whitespace-pre-wrap text-sm ${isDark ? "text-white" : "text-black"}`}>{item.input || "(empty)"}</pre>

              <p className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>Your Output</p>
              <pre className={`mb-2 whitespace-pre-wrap text-sm ${isDark ? "text-white" : "text-black"}`}>{item.output}</pre>

              <p className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>Expected Output</p>
              <pre className={`mb-2 whitespace-pre-wrap text-sm ${isDark ? "text-white" : "text-black"}`}>{item.expectedOutput}</pre>

              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.passed ? (isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700") : (isDark ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700")}`}>
                  {item.passed ? "Pass" : "Fail"}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.status === "Accepted" ? (isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700") : (isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700")}`}>
                  {item.status}
                </span>
                {typeof item.timeMs === "number" && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-white/10 text-white/80" : "bg-black/10 text-black/70"}`}>
                    {item.timeMs} ms
                  </span>
                )}
                {typeof item.memoryKb === "number" && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-white/10 text-white/80" : "bg-black/10 text-black/70"}`}>
                    {item.memoryKb} KB
                  </span>
                )}
              </div>
            </div>
          ))}

          {result.executionStats && (
            <div className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-black/45" : "border-black/10 bg-black/5"}`}>
              <p className={`text-xs ${isDark ? "text-white/65" : "text-black/65"}`}>Execution Performance</p>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className={isDark ? "text-white/70" : "text-black/70"}>Time (avg / max)</span>
                    <span className="font-semibold">{result.executionStats.avgTimeMs ?? 0} / {result.executionStats.maxTimeMs ?? 0} ms</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                    <div
                      className="h-2 rounded-full bg-amber-400"
                      style={{ width: `${Math.min(100, Math.max(8, Math.round(((result.executionStats.avgTimeMs ?? 0) / Math.max(1, result.executionStats.maxTimeMs ?? 1)) * 100)))}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className={isDark ? "text-white/70" : "text-black/70"}>Memory (avg / max)</span>
                    <span className="font-semibold">{result.executionStats.avgMemoryKb ?? 0} / {result.executionStats.maxMemoryKb ?? 0} KB</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                    <div
                      className="h-2 rounded-full bg-sky-400"
                      style={{ width: `${Math.min(100, Math.max(8, Math.round(((result.executionStats.avgMemoryKb ?? 0) / Math.max(1, result.executionStats.maxMemoryKb ?? 1)) * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(() => {
            if (!result.submitted) return null;

            const measuredCases = result.cases.filter((c) => typeof c.timeMs === "number" || typeof c.memoryKb === "number");
            const hasCaseMetrics = measuredCases.length > 0;

            const runtimeValues = hasCaseMetrics
              ? measuredCases.map((c) => Number(c.timeMs || 0))
              : [Number(result.executionStats?.avgTimeMs || 0)];
            const memoryValues = hasCaseMetrics
              ? measuredCases.map((c) => Number(c.memoryKb || 0))
              : [Number(result.executionStats?.avgMemoryKb || 0)];

            const runtimeMax = Math.max(1, ...runtimeValues);
            const memoryMax = Math.max(1, ...memoryValues);
            const runtimeCurrent = Number(result.executionStats?.avgTimeMs || runtimeValues[runtimeValues.length - 1] || 0);
            const memoryCurrent = Number(result.executionStats?.avgMemoryKb || memoryValues[memoryValues.length - 1] || 0);

            return (
              <div className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-black/45" : "border-black/10 bg-black/5"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-semibold ${isDark ? "text-white/70" : "text-black/70"}`}>Submission Performance Graph</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-white/10 text-white/85" : "bg-black/10 text-black/75"}`}>
                    {hasCaseMetrics ? `${measuredCases.length} measured cases` : "summary metrics"}
                  </span>
                </div>

                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div className={`rounded-lg border p-2.5 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className={isDark ? "text-white/65" : "text-black/65"}>Runtime</span>
                      <span className="font-semibold">{runtimeCurrent.toFixed(2)} ms</span>
                    </div>
                    <div className="flex h-20 items-end gap-1">
                      {runtimeValues.map((value, idx) => {
                        const height = Math.max(8, Math.round((value / runtimeMax) * 100));
                        return (
                          <div key={`runtime-bar-${idx}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-emerald-400/85"
                              style={{ height: `${height}%` }}
                              title={`Case ${idx + 1}: ${value.toFixed(2)} ms`}
                            />
                            <span className={`text-[10px] ${isDark ? "text-white/55" : "text-black/55"}`}>C{idx + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`rounded-lg border p-2.5 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className={isDark ? "text-white/65" : "text-black/65"}>Memory</span>
                      <span className="font-semibold">{memoryCurrent.toFixed(2)} KB</span>
                    </div>
                    <div className="flex h-20 items-end gap-1">
                      {memoryValues.map((value, idx) => {
                        const height = Math.max(8, Math.round((value / memoryMax) * 100));
                        return (
                          <div key={`memory-bar-${idx}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-sky-400/85"
                              style={{ height: `${height}%` }}
                              title={`Case ${idx + 1}: ${value.toFixed(2)} KB`}
                            />
                            <span className={`text-[10px] ${isDark ? "text-white/55" : "text-black/55"}`}>C{idx + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {performanceInsights && performanceInsights.totalMeasuredRuns > 0 && (
            <div className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-black/45" : "border-black/10 bg-black/5"}`}>
              <p className={`text-xs ${isDark ? "text-white/65" : "text-black/65"}`}>Personal Performance Insights</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div className={`rounded-lg border px-2.5 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                  <p className={`text-[11px] ${isDark ? "text-white/60" : "text-black/60"}`}>Time Trend</p>
                  <p className="text-sm font-semibold capitalize">{performanceInsights.timeTrend}</p>
                  <p className={`mt-0.5 text-[11px] ${isDark ? "text-white/70" : "text-black/70"}`}>
                    Avg: {performanceInsights.avgTimeMs ?? 0} ms | Best: {performanceInsights.bestTimeMs ?? 0} ms
                  </p>
                  {performanceInsights.currentRunPercentile.time !== null && (
                    <p className={`mt-0.5 text-[11px] ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                      Faster than {performanceInsights.currentRunPercentile.time}% of your runs
                    </p>
                  )}
                </div>
                <div className={`rounded-lg border px-2.5 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                  <p className={`text-[11px] ${isDark ? "text-white/60" : "text-black/60"}`}>Memory Trend</p>
                  <p className="text-sm font-semibold capitalize">{performanceInsights.memoryTrend}</p>
                  <p className={`mt-0.5 text-[11px] ${isDark ? "text-white/70" : "text-black/70"}`}>
                    Avg: {performanceInsights.avgMemoryKb ?? 0} KB | Best: {performanceInsights.bestMemoryKb ?? 0} KB
                  </p>
                  {performanceInsights.currentRunPercentile.memory !== null && (
                    <p className={`mt-0.5 text-[11px] ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                      Better memory than {performanceInsights.currentRunPercentile.memory}% of your runs
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {result.skillReport && (
            <div className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-black/45" : "border-black/10 bg-black/5"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-xs ${isDark ? "text-white/65" : "text-black/65"}`}>Post-Submission Skill Report</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"}`}>
                  Overall {result.skillReport.overallScore}%
                </span>
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {[
                  { label: "Approach", value: result.skillReport.approachQuality },
                  { label: "Optimization", value: result.skillReport.optimizationQuality },
                  { label: "Edge Cases", value: result.skillReport.edgeCaseQuality },
                ].map((row) => (
                  <div key={row.label} className={`rounded-lg border px-2.5 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <p className={`text-[11px] ${isDark ? "text-white/60" : "text-black/60"}`}>{row.label}</p>
                    <p className="text-sm font-semibold">{row.value}%</p>
                  </div>
                ))}
              </div>

              {result.skillReport.improvements.length > 0 && (
                <div className="mt-2">
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>Improvements</p>
                  <ul className={`mt-1 list-disc space-y-1 pl-4 text-xs ${isDark ? "text-white/85" : "text-black/85"}`}>
                    {result.skillReport.improvements.map((item) => (
                      <li key={`improvement-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle2, Search, Filter, ChevronLeft, ChevronRight, Code2, Zap, Trophy, ChevronDown } from "lucide-react";
import type { CodingQuestion } from "@/lib/codingQuestions";

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayLabel = value === "all" ? placeholder : value;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-hover border border-primary outline-none"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
      >
        <span>{label}: <strong>{displayLabel}</strong></span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-1.5 z-10 w-56 max-h-60 overflow-y-auto rounded-xl border border-primary p-1 shadow-2xl backdrop-blur-md"
          style={{ background: "var(--bg-secondary)" }}
        >
          <button
            type="button"
            onClick={() => { onChange("all"); setOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors font-medium"
            style={{ color: value === "all" ? "var(--brand-green)" : "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors font-medium truncate"
              style={{ color: value === opt ? "var(--brand-green)" : "var(--text-primary)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CodingQuestionsPage() {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [overallCount, setOverallCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");
  const [section, setSection] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});

  const totalSolved = useMemo(
    () => Object.values(submittedMap).filter(Boolean).length,
    [submittedMap]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ search, difficulty, topic, section, page: String(page), limit: String(limit) });
        const res = await fetch(`/api/questions?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
        const data = (await res.json()) as {
          questions?: CodingQuestion[]; error?: string; filteredCount?: number;
          overallCount?: number; topicOptions?: string[]; sectionOptions?: string[];
          topicCounts?: Record<string, number>; page?: number; totalPages?: number;
        };
        if (!res.ok) throw new Error(data.error || "Failed to load questions");
        if (!active) return;
        const loaded = data.questions || [];
        setQuestions(loaded);
        setFilteredCount(typeof data.filteredCount === "number" ? data.filteredCount : loaded.length);
        setOverallCount(typeof data.overallCount === "number" ? data.overallCount : loaded.length);
        setTopicOptions(Array.isArray(data.topicOptions) ? data.topicOptions : []);
        setTopicCounts(data.topicCounts || {});
        setSectionOptions(Array.isArray(data.sectionOptions) ? data.sectionOptions : []);
        setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);

        const ids = loaded.map((q) => q.id).filter(Boolean);
        if (ids.length > 0) {
          const progressParams = new URLSearchParams();
          ids.forEach((id) => progressParams.append("id", id));
          void fetch(`/api/questions/progress-map?${progressParams.toString()}`, { signal: controller.signal, cache: "no-store" })
            .then(async (pr) => {
              if (!pr.ok) return;
              const pd = (await pr.json()) as { solvedMap?: Record<string, boolean> };
              if (active) setSubmittedMap(pd.solvedMap || {});
            })
            .catch(() => {});
        }
      } catch (e) {
        if (!active) return;
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load questions");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [search, difficulty, topic, section, page, limit]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  const CURATED_TOPICS = useMemo(() => [
    { label: "Arrays", value: "array" },
    { label: "Strings", value: "string" },
    { label: "Hash Tables", value: "hash-table" },
    { label: "Dynamic Programming", value: "dynamic-programming" },
    { label: "Greedy", value: "greedy" },
    { label: "Sorting", value: "sorting" },
    { label: "Binary Search", value: "binary-search" },
    { label: "DFS", value: "depth-first-search" },
    { label: "BFS", value: "breadth-first-search" },
    { label: "Graphs", value: "graph" }
  ], []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">

        {loading ? (
          /* ── Unified Page-Wide Skeleton Screen (Prevents disjointed loads/flickers) ── */
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-700/20" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-700/20 rounded" />
                <div className="h-4 w-32 bg-gray-700/10 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="h-16 rounded-xl bg-gray-700/15 border border-transparent" />
              ))}
            </div>

            <div className="h-12 rounded-xl bg-gray-700/10" />

            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="h-12 rounded-xl bg-gray-700/15" />
              ))}
            </div>
          </div>
        ) : (
          /* ── Full Layout Load ── */
          <>
            {/* ── Header with Back Button and Progress Link ── */}
            <div className="mb-6 fade-in flex items-center justify-between border-b border-primary pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/placement-hub"
                  className="rounded-xl border border-primary p-2 text-xs font-semibold hover:bg-hover transition-all flex items-center gap-1.5"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Hub
                </Link>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,184,163,0.15)", border: "1px solid rgba(0,184,163,0.3)" }}
                >
                  <Code2 style={{ width: 20, height: 20, color: "var(--brand-green)" }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Coding Playground</h1>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Practice curated DSA & Aptitude challenges to crack top MNC exams.
                  </p>
                </div>
              </div>
              
              <Link
                href="/coding/profile"
                className="rounded-xl border border-primary px-3.5 py-2 text-xs font-bold hover:bg-hover transition-all flex items-center gap-1.5"
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                <Trophy className="w-4 h-4 text-amber-500" /> My Progress
              </Link>
            </div>

            {/* ── Topic/Algorithm Curation Grid (LeetCode-style) ── */}
            {overallCount > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 stagger-1 fade-in">
                {CURATED_TOPICS.map((t) => {
                  const isActive = topic === t.value;
                  const count = topicCounts[t.value] || 0;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setTopic(isActive ? "all" : t.value);
                        setPage(1);
                      }}
                      className="rounded-xl p-3 text-left transition-all hover:scale-[1.01] flex items-center justify-between"
                      style={{
                        background: isActive ? "rgba(0,184,163,0.08)" : "var(--bg-card)",
                        border: `1px solid ${isActive ? "var(--color-easy)" : "var(--border-primary)"}`,
                        cursor: "pointer",
                        boxShadow: isActive ? "0 0 10px rgba(0,184,163,0.1)" : "none",
                      }}
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-xs font-semibold truncate" style={{ color: isActive ? "var(--color-easy)" : "var(--text-primary)" }}>
                          {t.label}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {count > 0 ? `${count} problems` : "0 problems"}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: isActive ? "var(--color-easy)" : "var(--text-muted)" }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Filter bar ── */}
            <div
              className="flex flex-wrap gap-3 mb-5 p-3 rounded-xl stagger-2 fade-in"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
            >
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search problems..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
                />
              </div>

              <div
                style={{ width: 1, height: 24, background: "var(--border-primary)", alignSelf: "center" }}
              />

              {/* Difficulty filter */}
              <div className="flex items-center gap-1">
                {(["all", "easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDifficulty(d); setPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: difficulty === d
                        ? d === "easy" ? "rgba(0,184,163,0.15)" : d === "medium" ? "rgba(255,161,22,0.15)" : d === "hard" ? "rgba(239,71,67,0.15)" : "var(--bg-active)"
                        : "transparent",
                      color: difficulty === d
                        ? d === "easy" ? "var(--color-easy)" : d === "medium" ? "var(--color-medium)" : d === "hard" ? "var(--color-hard)" : "var(--text-primary)"
                        : "var(--text-muted)",
                      border: `1px solid ${difficulty === d
                        ? d === "easy" ? "rgba(0,184,163,0.3)" : d === "medium" ? "rgba(255,161,22,0.3)" : d === "hard" ? "rgba(239,71,67,0.3)" : "var(--border-secondary)"
                        : "transparent"
                      }`,
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              {/* Topic filter */}
              {topicOptions.length > 0 && (
                <CustomDropdown
                  label="Topic"
                  value={topic}
                  options={topicOptions}
                  onChange={(val) => { setTopic(val); setPage(1); }}
                  placeholder="All Topics"
                />
              )}

              {/* Section filter */}
              {sectionOptions.length > 0 && (
                <CustomDropdown
                  label="Section"
                  value={section}
                  options={sectionOptions}
                  onChange={(val) => { setSection(val); setPage(1); }}
                  placeholder="All Sections"
                />
              )}
            </div>

            {/* ── Results count ── */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {filteredCount > 0 ? `Showing ${questions.length} of ${filteredCount} problems` : "No problems found"}
              </p>
              {filteredCount !== overallCount && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setDifficulty("all"); setTopic("all"); setSection("all"); setPage(1); }}
                  className="text-xs"
                  style={{ color: "var(--brand-blue)", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  Clear filters
                </button>
              )}
            </div>

        {/* ── Table / List Container ── */}
        {error ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "rgba(239,71,67,0.08)", border: "1px solid rgba(239,71,67,0.2)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--color-wrong)" }}>{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4" style={{ opacity: 0.15 }}>🔍</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No problems match your filters</p>
            <button
              type="button"
              onClick={() => { setSearch(""); setDifficulty("all"); setTopic("all"); setSection("all"); setPage(1); }}
              className="btn btn-ghost mt-3 text-xs"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden stagger-3 fade-in"
            style={{ border: "1px solid var(--border-primary)" }}
          >
            {/* Table header */}
            <div
              className="grid text-[11px] font-semibold uppercase tracking-wide px-4 py-2.5"
              style={{
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-primary)",
                color: "var(--text-muted)",
                gridTemplateColumns: "32px 1fr 90px 90px 90px 90px",
                gap: "12px",
              }}
            >
              <span>#</span>
              <span>Title</span>
              <span>Difficulty</span>
              <span>Acceptance</span>
              <span>Topics</span>
              <span className="text-right">Status</span>
            </div>

            {/* Table rows */}
            <div>
              {questions.map((q, idx) => {
                const solved = submittedMap[q.id] === true;
                const diffColor = q.difficulty === "Easy" ? "var(--color-easy)" : q.difficulty === "Medium" ? "var(--color-medium)" : "var(--color-hard)";
                const globalIndex = (page - 1) * limit + idx + 1;

                return (
                  <Link
                    key={q.id}
                    href={`/question/${q.id}`}
                    className="problem-row"
                    style={{ gridTemplateColumns: "32px 1fr 90px 90px 90px 90px", gap: "12px", textDecoration: "none", color: "inherit" }}
                  >
                    {/* Index */}
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {globalIndex}
                    </span>

                    {/* Title */}
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate transition-colors"
                        style={{ color: solved ? "var(--color-easy)" : "var(--text-primary)" }}
                      >
                        {q.title}
                      </p>
                      {q.company_tags && q.company_tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {q.company_tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(88,166,255,0.08)", color: "var(--text-muted)" }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Difficulty */}
                    <span
                      className="text-xs font-semibold"
                      style={{ color: diffColor }}
                    >
                      {q.difficulty}
                    </span>

                    {/* Acceptance */}
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {q.acceptance_rate > 0 ? `${q.acceptance_rate.toFixed(1)}%` : "-"}
                    </span>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-1">
                      {q.topic.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border-primary)" }}
                        >
                          {t}
                        </span>
                      ))}
                      {q.topic.length > 2 && (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{q.topic.length - 2}</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex justify-end">
                      {solved ? (
                        <CheckCircle2 style={{ width: 16, height: 16, color: "var(--color-easy)" }} />
                      ) : (
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--border-secondary)" }} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-ghost"
              style={{ padding: "6px 12px" }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                let pageNum = idx + 1;
                if (totalPages > 7) {
                  if (page <= 4) pageNum = idx + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + idx;
                  else pageNum = page - 3 + idx;
                }
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: page === pageNum ? "var(--brand-green)" : "var(--bg-hover)",
                      color: page === pageNum ? "#0d1117" : "var(--text-secondary)",
                      border: `1px solid ${page === pageNum ? "transparent" : "var(--border-primary)"}`,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-ghost"
              style={{ padding: "6px 12px" }}
            >
              Next
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
}

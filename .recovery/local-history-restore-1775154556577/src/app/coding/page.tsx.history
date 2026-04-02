"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CodingQuestion } from "@/lib/codingQuestions";

export default function CodingQuestionsPage() {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [overallCount, setOverallCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");
  const [company, setCompany] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          search,
          difficulty,
          topic,
          company,
          page: String(page),
          limit: String(limit),
        });

        const res = await fetch(`/api/questions?${params.toString()}`, { signal: controller.signal });
        const data = (await res.json()) as {
          questions?: CodingQuestion[];
          error?: string;
          filteredCount?: number;
          overallCount?: number;
          topicOptions?: string[];
          companyOptions?: string[];
          page?: number;
          totalPages?: number;
        };
        if (!res.ok) throw new Error(data.error || "Failed to load questions");
        setQuestions(data.questions || []);
        setFilteredCount(typeof data.filteredCount === "number" ? data.filteredCount : (data.questions || []).length);
        setOverallCount(typeof data.overallCount === "number" ? data.overallCount : (data.questions || []).length);
        setTopicOptions(Array.isArray(data.topicOptions) ? data.topicOptions : []);
        setCompanyOptions(Array.isArray(data.companyOptions) ? data.companyOptions : []);
        setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load questions");
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [search, difficulty, topic, company, page, limit]);

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (event.key === "ArrowRight" && page < totalPages) {
        setPage((p) => Math.min(totalPages, p + 1));
      }
      if (event.key === "ArrowLeft" && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page, totalPages]);

  return (
    <main className={`min-h-screen px-6 pb-10 pt-4 ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"}`}>
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/placement-hub" className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}>
            Back To Placement Hub
          </Link>
        </div>

        <div className={`rounded-2xl border p-5 backdrop-blur-lg ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <h1 className="text-3xl font-semibold">Coding Questions</h1>
          <p className={`mt-1 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Company-wise and topic-wise DSA practice in a clean interview workflow.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>
              Overall Questions: {overallCount}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>
              Matched: {filteredCount}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>
              Page: {page}/{totalPages}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search questions by title, topic, company..."
              className={`rounded-xl border px-3 py-2 text-sm outline-none lg:col-span-2 ${isDark ? "border-white/15 bg-black/40" : "border-black/15 bg-white"}`}
            />
            <select value={difficulty} onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/15 bg-black/40" : "border-black/15 bg-white"}`}>
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select value={topic} onChange={(e) => {
              setTopic(e.target.value);
              setPage(1);
            }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/15 bg-black/40" : "border-black/15 bg-white"}`}>
              <option value="all">All Topics</option>
              {topicOptions.map((t) => (
                <option key={t} value={t.toLowerCase()}>
                  {t}
                </option>
              ))}
            </select>
            <select value={company} onChange={(e) => {
              setCompany(e.target.value);
              setPage(1);
            }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/15 bg-black/40" : "border-black/15 bg-white"}`}>
              <option value="all">All Companies</option>
              {companyOptions.map((c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDifficulty("all");
                setTopic("all");
                setCompany("all");
                setPage(1);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isDark ? "border border-white/15 bg-black/40 hover:bg-white/10" : "border border-black/15 bg-white hover:bg-black/5"
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className={`overflow-hidden rounded-2xl border backdrop-blur-lg ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <div className={`grid grid-cols-[2fr_1fr_1fr_1fr] border-b px-4 py-3 text-xs uppercase tracking-wide ${isDark ? "border-white/10 text-white/60" : "border-black/10 text-black/60"}`}>
            <p>Title</p>
            <p>Difficulty</p>
            <p>Company</p>
            <p>Topics</p>
          </div>

          {loading && <p className={`p-4 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Loading questions...</p>}
          {error && <p className="p-4 text-sm text-rose-300">{error}</p>}
          {!loading && !error && questions.length === 0 && <p className={`p-4 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>No questions found for selected filters.</p>}

          {!loading && !error &&
            questions.map((q) => (
              <Link
                key={q.id}
                href={`/question/${q.id}`}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-4 py-3 text-sm transition ${isDark ? "text-white/90 hover:bg-white/8" : "text-black/85 hover:bg-black/5"}`}
              >
                <p className="font-medium">{q.title}</p>
                <p>{q.difficulty}</p>
                <p className="truncate">{(q.company_tags || []).slice(0, 3).join(", ") || "-"}</p>
                <p className="truncate">{q.topic.slice(0, 4).join(", ") || "-"}</p>
              </Link>
            ))}

          {!loading && !error && (
            <div className={`flex items-center justify-between border-t px-4 py-3 text-sm ${isDark ? "border-white/10 text-white/80" : "border-black/10 text-black/80"}`}>
              <p>
                Page {page} / {totalPages} • {questions.length} shown on this page • {filteredCount} total matched
              </p>
              <div className="hidden items-center gap-2 md:flex">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  Prev
                </button>
                {pageButtons.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-3 py-1.5 font-semibold ${
                      p === page
                        ? isDark
                          ? "border-white bg-white text-black"
                          : "border-black bg-black text-white"
                        : isDark
                        ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                        : "border-black/20 bg-black/5 text-black hover:bg-black/10"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  Next
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  Last
                </button>
              </div>

              <div className="flex gap-2 md:hidden">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${isDark ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, Circle, Search, ChevronLeft, ChevronRight, Code2, Trophy, 
  Sparkles, Layers, GitFork, Building2, Calendar, Flame, History
} from "lucide-react";
import { SOLVING_PATTERNS } from "@/lib/codingMetadata";
import type { QuestionRichMetadata } from "@/lib/codingMetadata";
import { LeetCodeProfileModal } from "@/components/coding/LeetCodeProfileModal";

const COMPANIES = ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Uber', 'Netflix', 'Adobe', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini'];

function CodingQuestionsPageContent() {
  const searchParams = useSearchParams();
  const trackParam = searchParams?.get("track") || "";
  const patternParam = searchParams?.get("pattern") || "";

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [questions, setQuestions] = useState<QuestionRichMetadata[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [overallCount, setOverallCount] = useState(6902);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [pattern, setPattern] = useState(patternParam || "all");
  const [company, setCompany] = useState("all");

  const [patternCounts, setPatternCounts] = useState<Record<string, number>>({});
  const [companyCounts, setCompanyCounts] = useState<Record<string, number>>({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});

  // Sync server progress map for loaded questions
  const syncProgressMap = async (qList: QuestionRichMetadata[]) => {
    if (qList.length === 0) return;
    const ids = qList.map((q) => q.id).filter(Boolean);
    try {
      const res = await fetch(`/api/questions/progress-map?ids=${encodeURIComponent(ids.join(','))}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.solvedMap) {
          setSubmittedMap((prev) => ({ ...prev, ...data.solvedMap }));
        }
      }
    } catch {
      // Fallback to local storage if API fails
    }
  };

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('nexthire_user_submissions');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        if (Array.isArray(history)) {
          const map: Record<string, boolean> = {};
          history.forEach((item: any) => {
            const isAccepted = (item.status === 'Accepted' || item.result === 'Accepted') &&
              (typeof item.total !== 'number' || item.passed === item.total);
            const qId = item.questionId || item.question_id || item.problemId;
            if (isAccepted && qId) {
              map[String(qId)] = true;
            }
          });
          setSubmittedMap((prev) => ({ ...map, ...prev }));
        }
      }
    } catch {}
  }, []);

  const totalSolved = useMemo(
    () => Object.values(submittedMap).filter(Boolean).length,
    [submittedMap]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
        ...(difficulty !== "all" ? { difficulty } : {}),
        ...(pattern !== "all" ? { pattern } : {}),
        ...(company !== "all" ? { company } : {}),
        ...(trackParam ? { track: trackParam } : {})
      });

      const res = await fetch(`/api/questions?${query.toString()}`);
      const data = await res.json();

      const qList: QuestionRichMetadata[] = data.questions || data.data || [];
      if (data.success !== false) {
        setQuestions(qList);
        setFilteredCount(data.filteredCount ?? qList.length);
        setOverallCount(data.overallTotal || data.overallCount || 4005);
        setTotalPages(data.totalPages || 1);
        if (data.patternCounts) setPatternCounts(data.patternCounts);
        if (data.companyCounts) setCompanyCounts(data.companyCounts);
        setError(null);
        void syncProgressMap(qList);
      } else {
        setError(data.error || "Failed to load coding questions");
      }
    } catch (err: any) {
      setError(typeof err === 'object' ? err.message || JSON.stringify(err) : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, difficulty, pattern, company, trackParam, page]);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <Link
              href="/placement-hub"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Hub
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <Code2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                Enterprise Coding Arena
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">V1.0</span>
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                LeetCode + NeetCode + InterviewBit platform. 6,902+ canonical questions mapped to 46+ patterns and subtopics.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 items-end">
            {/* Top Row: History & Knowledge Graph */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer hover:text-white"
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>History</span>
              </button>

              <Link
                href="/coding/knowledge-graph"
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition flex items-center gap-2"
              >
                <GitFork className="w-4 h-4 text-amber-400" /> Knowledge Graph
              </Link>
            </div>

            {/* Bottom Row: Skill Tree & Analytics */}
            <Link
              href="/coding/analytics"
              className="w-full text-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-emerald-200" /> Skill Tree & Analytics
            </Link>
          </div>
        </header>

        {/* ── LEETCODE DASHBOARD PROFILE & SUBMISSION HISTORY MODAL ── */}
        <LeetCodeProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />

        {/* Skill Tree Progress Bar (DSA Topics Only - System Design Removed) */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Topic Skill Tree Mastery
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              Solved: {totalSolved} / {overallCount || 4005} ({Math.round((totalSolved / (overallCount || 4005)) * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                <span>Arrays & Hashing</span>
                <span className="text-emerald-400">80%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                <span>Two Pointers</span>
                <span className="text-emerald-400">65%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                <span>Trees & Graphs</span>
                <span className="text-amber-400">45%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[45%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                <span>Dynamic Programming</span>
                <span className="text-red-400">25%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full w-[25%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Multi-Filter Toolbar */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex items-center bg-black border border-zinc-800 rounded-xl px-3.5 py-2 flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search title, pattern, company..."
                className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none w-full"
              />
            </div>

            {/* Difficulty Selector */}
            <div className="flex bg-black border border-zinc-800 rounded-xl p-1">
              {['all', 'easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    difficulty === d ? 'bg-emerald-500 text-black font-extrabold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Pattern Filter with Problem Counts */}
            <select
              value={pattern}
              onChange={(e) => { setPattern(e.target.value); setPage(1); }}
              className="bg-black border border-zinc-800 text-xs text-white rounded-xl px-3.5 py-2 outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Solving Patterns (46+)</option>
              {SOLVING_PATTERNS.map((p) => {
                const count = patternCounts[p] || patternCounts[p.toLowerCase()] || 87;
                return (
                  <option key={p} value={p.toLowerCase()}>
                    {p} ({count})
                  </option>
                );
              })}
            </select>

            {/* Company Filter with Problem Counts */}
            <select
              value={company}
              onChange={(e) => { setCompany(e.target.value); setPage(1); }}
              className="bg-black border border-zinc-800 text-xs text-white rounded-xl px-3.5 py-2 outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Target Companies</option>
              {COMPANIES.map((c) => {
                const count = companyCounts[c] || companyCounts[c.toLowerCase()] || 180;
                return (
                  <option key={c} value={c.toLowerCase()}>
                    {c} ({count})
                  </option>
                );
              })}
            </select>

            {/* Reset Filters */}
            <button
              onClick={() => { setSearch(''); setDifficulty('all'); setPattern('all'); setCompany('all'); setPage(1); }}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
            <span>Showing <strong className="text-white">{filteredCount}</strong> matching questions (Total: {overallCount})</span>
          </div>
        </div>

        {/* Problem List Table (Cleaned Columns with S.No) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Status</th>
                  <th className="py-3.5 px-4 w-16 text-center">S.No</th>
                  <th className="py-3.5 px-4">Title & Subtopic</th>
                  <th className="py-3.5 px-4 w-28 text-center">Difficulty</th>
                  <th className="py-3.5 px-4">Company Tags</th>
                  <th className="py-3.5 px-4 text-right w-28">Acceptance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-500 font-mono">
                      Loading canonical questions bundle...
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-500">
                      No questions found matching your filter parameters.
                    </td>
                  </tr>
                ) : (
                    questions.map((q, idx) => {
                      const isSolved = submittedMap[q.id];
                      const serialNumber = (page - 1) * limit + idx + 1;
                      return (
                        <tr key={`${q.id}_${idx}`} className="hover:bg-zinc-800/40 transition-colors group">
                        <td className="py-3.5 px-4 text-center">
                          {isSolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-600 inline group-hover:text-zinc-400" />
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-400">
                          {serialNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <Link href={`/coding/problem/${q.id}`} className="font-bold text-white hover:text-emerald-400 transition text-sm">
                            {q.title}
                          </Link>
                          <span className="block text-[11px] text-zinc-500 mt-0.5">
                            <strong className="text-emerald-400/90 font-semibold">{q.primaryPattern}</strong> {q.subtopic ? `• ${q.subtopic}` : ''}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {q.difficulty}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(q.companies || []).slice(0, 3).map((c) => (
                              <span key={c.name} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-medium text-zinc-300 border border-zinc-700/50">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-zinc-300">
                          {q.acceptanceRate}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 bg-zinc-800 text-xs font-bold text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-zinc-400 font-mono">
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-zinc-800 text-xs font-bold text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CodingQuestionsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-black text-zinc-400 flex items-center justify-center font-mono text-xs">
        Loading Enterprise Arena...
      </div>
    }>
      <CodingQuestionsPageContent />
    </Suspense>
  );
}

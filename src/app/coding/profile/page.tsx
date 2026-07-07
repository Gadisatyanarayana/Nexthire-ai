"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChevronLeft, User, Mail, Award, Flame, CheckCircle,
  XCircle, Clock, Calendar, RefreshCw
} from "lucide-react";

export default function CodingProfilePage() {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(2026);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch profile stats");
      const data = await res.json();
      setStats(data.stats);
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      setError(err?.message || "Something went wrong while loading stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      void fetchData();
    }
  }, [session, fetchData]);

  // Generate date array for the selected year (53 weeks * 7 days)
  const calendarWeeks = useMemo(() => {
    const weeks: Array<Array<{ date: Date; dateStr: string; count: number } | null>> = [];
    
    // First day of the year
    const firstDay = new Date(selectedCalendarYear, 0, 1);
    const dayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Generate dates from the Sunday before or on Jan 1st
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - dayOfWeek);

    // Map user submission counts by day key "YYYY-MM-DD"
    const submissionDaysMap = new Map<string, number>();
    submissions.forEach((sub: any) => {
      if (sub.created_at) {
        const key = new Date(sub.created_at).toISOString().slice(0, 10);
        submissionDaysMap.set(key, (submissionDaysMap.get(key) || 0) + 1);
      }
    });

    const currentCursor = new Date(startDate);
    for (let w = 0; w < 53; w++) {
      const week: Array<{ date: Date; dateStr: string; count: number } | null> = [];
      for (let d = 0; d < 7; d++) {
        // Only include days within the target year
        if (currentCursor.getFullYear() === selectedCalendarYear) {
          const dateStr = currentCursor.toISOString().slice(0, 10);
          const count = submissionDaysMap.get(dateStr) || 0;
          week.push({
            date: new Date(currentCursor),
            dateStr,
            count
          });
        } else {
          week.push(null);
        }
        currentCursor.setDate(currentCursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [selectedCalendarYear, submissions]);

  // Generate Month Spans dynamically for month headers row
  const monthLabels = useMemo(() => {
    const labels: Array<{ text: string; colSpan: number }> = [];
    let currentMonth = -1;
    let currentSpan = 0;

    calendarWeeks.forEach((week) => {
      const firstDay = week.find((day) => day !== null);
      if (firstDay) {
        const m = firstDay.date.getMonth();
        if (m !== currentMonth) {
          if (currentSpan > 0 && labels.length > 0) {
            labels[labels.length - 1].colSpan = currentSpan;
          }
          labels.push({
            text: firstDay.date.toLocaleString(undefined, { month: "short" }),
            colSpan: 1
          });
          currentMonth = m;
          currentSpan = 1;
        } else {
          currentSpan++;
        }
      } else {
        if (currentSpan > 0) {
          currentSpan++;
        }
      }
    });
    if (labels.length > 0 && currentSpan > 0) {
      labels[labels.length - 1].colSpan = currentSpan;
    }
    return labels;
  }, [calendarWeeks]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Please sign in to view your progress</h2>
          <Link href="/auth/signin" className="btn inline-block px-5 py-2.5 rounded-xl border border-primary text-xs font-bold transition hover:bg-hover" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const totalSolved = stats?.solvedCount || 0;
  const easySolved = stats?.byDifficulty?.easy || 0;
  const mediumSolved = stats?.byDifficulty?.medium || 0;
  const hardSolved = stats?.byDifficulty?.hard || 0;

  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/coding"
            className="rounded-xl border border-primary px-3 py-1.5 text-xs font-semibold hover:bg-hover transition-all flex items-center gap-1.5"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            <ChevronLeft className="w-4 h-4" /> Back to Playground
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">My coding dashboard</span>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-44 rounded-2xl bg-gray-700/10 border border-primary" />
              <div className="h-44 rounded-2xl bg-gray-700/10 border border-primary" />
              <div className="h-44 rounded-2xl bg-gray-700/10 border border-primary" />
            </div>
            <div className="h-64 rounded-2xl bg-gray-700/10 border border-primary" />
            <div className="h-80 rounded-2xl bg-gray-700/10 border border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-red-400 font-semibold">{error}</p>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 mx-auto rounded-xl border text-xs font-bold transition hover:bg-hover" style={{ background: "var(--bg-secondary)" }}>
              <RefreshCw className="h-4.5 w-4.5" /> Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="rounded-2xl border border-primary p-6 flex flex-col justify-between shadow-xl" style={{ background: "var(--bg-card)" }}>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-400" /> Candidate Account
                  </h3>
                  <h2 className="text-xl font-bold tracking-tight">{stats?.personal?.name || session.user?.name || "Active Student"}</h2>
                  <p className="text-xs mt-1.5 flex items-center gap-2 text-foreground/60">
                    <Mail className="h-3.5 w-3.5" /> {stats?.personal?.email || session.user?.email || "N/A"}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-primary flex justify-between text-[11px] text-foreground/40 font-mono">
                  <span>Joined:</span>
                  <span>
                    {stats?.personal?.joinedAt
                      ? new Date(stats.personal.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : "Recently"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-primary p-6 flex flex-col justify-between shadow-xl" style={{ background: "var(--bg-card)" }}>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber-500 fill-amber-500" /> Active Streak
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-amber-500">{stats?.currentStreak || 0}</span>
                    <span className="text-sm font-semibold text-foreground/60">Consecutive Days</span>
                  </div>
                  <p className="text-xs mt-3 leading-relaxed text-foreground/60">
                    Practice daily to build muscle memory and improve logic speed.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-primary text-[10px] text-amber-500/70 font-semibold uppercase tracking-wider">
                  🔥 Keep up the practice!
                </div>
              </div>

              <div className="rounded-2xl border border-primary p-6 flex flex-col justify-between shadow-xl" style={{ background: "var(--bg-card)" }}>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-3 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-cyan-400" /> Solved Questions
                  </h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-cyan-400">{totalSolved}</span>
                    <span className="text-xs text-foreground/40 font-bold">/ {stats?.totalSubmissions || 0} submissions</span>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-foreground/60 mb-0.5">
                        <span style={{ color: "var(--color-easy)" }}>Easy</span>
                        <span>{easySolved}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalSolved > 0 ? (easySolved / totalSolved) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-foreground/60 mb-0.5">
                        <span style={{ color: "var(--color-medium)" }}>Medium</span>
                        <span>{mediumSolved}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalSolved > 0 ? (mediumSolved / totalSolved) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-foreground/60 mb-0.5">
                        <span style={{ color: "var(--color-hard)" }}>Hard</span>
                        <span>{hardSolved}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalSolved > 0 ? (hardSolved / totalSolved) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* LeetCode Multi-Year Contribution Calendar */}
            <div className="rounded-2xl border border-primary p-6 shadow-xl space-y-4" style={{ background: "var(--bg-card)" }}>
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-primary gap-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-400" /> Contribution Activity Calendar
                </h3>
                
                {/* Year Selectors Group: Current year + 3 years */}
                <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-0.5 border border-primary text-[10px] font-bold">
                  {[2026, 2027, 2028, 2029].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedCalendarYear(yr)}
                      className={`px-2.5 py-1 rounded transition-all ${selectedCalendarYear === yr ? 'bg-cyan-400 text-black font-extrabold shadow-sm' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto no-scrollbar py-2 flex justify-center">
                <div className="min-w-[660px] flex flex-col gap-1.5 font-sans w-full max-w-[720px]">
                  
                  {/* Month headers dynamic offsets */}
                  <div className="flex text-[9px] text-foreground/45 pl-6 select-none">
                    {monthLabels.map((lbl, idx) => (
                      <span key={idx} className="block text-left" style={{ width: `${lbl.colSpan * 11.9}px` }}>
                        {lbl.text}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Days labels list */}
                    <div className="flex flex-col gap-[3px] text-[8px] text-foreground/35 select-none w-4 pt-[1px]">
                      <span>Mon</span>
                      <span className="opacity-0">Tue</span>
                      <span>Wed</span>
                      <span className="opacity-0">Thu</span>
                      <span>Fri</span>
                      <span className="opacity-0">Sat</span>
                      <span>Sun</span>
                    </div>

                    {/* 53 Columns Grid */}
                    <div className="flex gap-[3px]">
                      {calendarWeeks.map((week, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-[3px]">
                          {week.map((day, rowIdx) => {
                            if (!day) {
                              return <div key={rowIdx} className="w-[9px] h-[9px] bg-transparent" />;
                            }
                            const count = day.count;
                            let bg = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
                            if (count > 0 && count <= 2) bg = "rgba(0, 184, 163, 0.25)";
                            else if (count > 2 && count <= 4) bg = "rgba(0, 184, 163, 0.55)";
                            else if (count > 4) bg = "rgba(0, 184, 163, 0.95)";

                            return (
                              <div
                                key={rowIdx}
                                title={`${new Date(day.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}: ${count} submission${count === 1 ? '' : 's'}`}
                                className="w-[9px] h-[9px] rounded-[1.5px] transition-all hover:ring-1 hover:ring-cyan-400/80 cursor-pointer"
                                style={{ background: bg }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary p-6 shadow-xl" style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center justify-between pb-3 border-b border-primary mb-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-cyan-400" /> Detailed Submission Logs
                </h3>
                <span className="text-[10px] font-mono text-foreground/40">Showing latest records</span>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 text-foreground/40 text-xs">
                  No coding submissions logged yet. Solve questions in the playground to see them here!
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-foreground/50 border-b border-primary">
                        <th className="py-3 font-semibold">Problem</th>
                        <th className="py-3 font-semibold">Status / Result</th>
                        <th className="py-3 font-semibold">Language</th>
                        <th className="py-3 font-semibold">Difficulty</th>
                        <th className="py-3 font-semibold">Time Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub: any) => {
                        const isPassed = String(sub.result).toLowerCase() === "passed" || String(sub.result).toLowerCase() === "accepted";
                        return (
                          <tr key={sub.id} className="border-b border-primary/50 transition hover:bg-foreground/5">
                            <td className="py-3.5 font-semibold">
                              <Link
                                href={sub.question_id ? `/question/${sub.question_id}` : "/coding"}
                                className="text-cyan-400 font-bold hover:underline transition"
                              >
                                {sub.question_title || "Practice Question"}
                              </Link>
                            </td>
                            <td className="py-3.5">
                              <span className="flex items-center gap-1.5 font-bold">
                                {isPassed ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span className="text-emerald-400 uppercase tracking-wider text-[10px]">Passed</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-red-400 uppercase tracking-wider text-[10px]">Failed</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3.5 font-mono text-foreground/80">{sub.language || "unknown"}</td>
                            <td className="py-3.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sub.difficulty === "Easy" ? "var(--color-easy)" : sub.difficulty === "Medium" ? "var(--color-medium)" : "var(--color-hard)", background: sub.difficulty === "Easy" ? "rgba(0,184,163,0.12)" : sub.difficulty === "Medium" ? "rgba(255,161,22,0.12)" : "rgba(239,71,67,0.12)" }}>
                                {sub.difficulty || "Medium"}
                              </span>
                            </td>
                            <td className="py-3.5 text-foreground/60">{new Date(sub.created_at).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

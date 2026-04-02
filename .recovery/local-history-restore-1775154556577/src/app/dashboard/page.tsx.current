'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { resilientFetch } from '@/lib/resilientFetch';

type DashboardStats = {
  currentStreak: number;
  weeklyActivity: Array<number | { day: string; count: number }>;
  totalSubmissions: number;
  solvedCount: number;
  successRate: number;
  latestSubmissionAt: string | null;
  byDifficulty: { easy: number; medium: number; hard: number; unknown: number };
  byLanguage: Array<{ language: string; count: number }>;
  sectionProgress?: Array<{
    sectionId: string;
    sectionLabel: string;
    solved: number;
    total: number;
    completionRate: number;
    recentSolved14: number;
  }>;
  resumeStats?: {
    analyzerUses: number;
    builderUses: number;
  };
  personal?: {
    name?: string;
    email?: string;
    joinedAt?: string;
  };
  activitySummary?: {
    lastLoginAt: string | null;
    totalTimeSpentMinutes: number;
    topPages: Array<{ path: string; visits: number }>;
    chatbotSearches: Array<{ query: string; at: string }>;
    contestActionCount: number;
    questionRunCount: number;
    questionSubmitCount: number;
  };
  contestReports?: Array<{
    contestId: string | null;
    createdAt: string;
    rating: number;
    acceptanceRate: number;
    acceptedCount: number;
    attemptedCount: number;
    timedOut: boolean;
    suggestions: string[];
  }>;
  voiceInterviewSummary?: {
    totalInterviews: number;
    averageOverallScore: number;
    averageIntroScore: number;
    averageCodingScore: number;
    trend: Array<{
      createdAt: string;
      overallScore: number;
      introScore: number;
      codeScore: number;
    }>;
  };
};

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Initialize theme synchronously
  useLayoutEffect(() => {
    const root = document.documentElement;
    const theme = localStorage.getItem('theme') || 'dark';
    const isDarkTheme = theme === 'dark';
    setIsDark(isDarkTheme);
    root.setAttribute('data-theme', theme);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setLoading(false);
      return;
    }

    let alive = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await resilientFetch('/api/dashboard/stats', undefined, { retries: 1, timeoutMs: 7000, retryDelayMs: 250 });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load dashboard stats');
        }

        const data = await response.json();
        if (alive) {
          setStats((data?.stats || data) as DashboardStats);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      alive = false;
    };
  }, [session, status]);

  if (!isMounted || status === 'loading') {
    return <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center`}>Loading...</div>;
  }

  if (!session?.user) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Please sign in to view your personalized dashboard.</p>
          <Link href="/auth/signin" className={`inline-block rounded-xl px-6 py-3 font-semibold ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const byDifficultySafe = stats?.byDifficulty ?? { easy: 0, medium: 0, hard: 0, unknown: 0 };
  const readinessScore = stats
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            stats.successRate * 0.35 +
              Math.min(25, stats.currentStreak * 3) +
              Math.min(20, stats.solvedCount * 0.6) +
              Math.min(20, ((stats.resumeStats?.analyzerUses || 0) + (stats.resumeStats?.builderUses || 0)) * 2)
          )
        )
      )
    : 0;
  const readinessBand = readinessScore >= 80 ? 'Interview Ready' : readinessScore >= 55 ? 'On Track' : 'Needs Focus';
  const weakestSections = (stats?.sectionProgress || [])
    .filter((row) => row.total >= 8)
    .sort((a, b) => {
      if (a.completionRate !== b.completionRate) return a.completionRate - b.completionRate;
      if (a.recentSolved14 !== b.recentSolved14) return a.recentSolved14 - b.recentSolved14;
      return b.total - a.total;
    })
    .slice(0, 3);
  const weeklySeries = (stats?.weeklyActivity || []).map((item, idx) => {
    if (typeof item === 'number') {
      return { day: `Day ${idx + 1}`, submissions: Number(item || 0) };
    }
    return {
      day: String(item?.day || `Day ${idx + 1}`),
      submissions: Number(item?.count || 0),
    };
  });
  const recent14Total = weeklySeries.reduce((sum, row) => sum + Number(row.submissions || 0), 0);
  const dailyTarget = recent14Total < 10 ? 2 : recent14Total < 22 ? 3 : 4;
  const weeklyPlanner = stats
    ? [
        {
          day: "Mon",
          focus: weakestSections[0]?.sectionLabel || "Arrays & Hashing",
          goal: `Solve ${dailyTarget} problems and write 1 complexity note.`,
          href: `/coding?section=${encodeURIComponent((weakestSections[0]?.sectionId || "arrays-hashing").toLowerCase())}`,
        },
        {
          day: "Tue",
          focus: weakestSections[1]?.sectionLabel || "Two Pointers / Sliding Window",
          goal: `Solve ${dailyTarget} problems and add 2 custom edge cases.`,
          href: `/coding?section=${encodeURIComponent((weakestSections[1]?.sectionId || "two-pointers-sliding-window").toLowerCase())}`,
        },
        {
          day: "Wed",
          focus: weakestSections[2]?.sectionLabel || "Dynamic Programming",
          goal: `Solve ${dailyTarget} problems and compare brute-force vs optimized approach.`,
          href: `/coding?section=${encodeURIComponent((weakestSections[2]?.sectionId || "dynamic-programming").toLowerCase())}`,
        },
        {
          day: "Thu",
          focus: "Mock OA Mix",
          goal: "Attempt 1 timed set: easy + medium + hard.",
          href: "/contests",
        },
        {
          day: "Fri",
          focus: "Resume + Reflection",
          goal: "Update one project bullet and capture weekly learning wins.",
          href: "/resume-analyzer",
        },
        {
          day: "Sat",
          focus: "Revision + Reattempt",
          goal: "Reattempt 3 previously wrong problems without hints.",
          href: "/coding",
        },
      ]
    : [];

  const adaptiveRecommendations = stats ? [
    ...(stats.totalSubmissions < 5 ? [{
      title: 'Start Coding Practice',
      href: '/coding',
      note: 'Solve at least 5 problems this week to build OA confidence.',
    }] : []),
    ...(stats.successRate < 60 ? [{
      title: 'Improve Resume Quality',
      href: '/resume-analyzer',
      note: 'Raise ATS and role-match to improve shortlist probability.',
    }] : []),
    ...(byDifficultySafe.hard === 0 ? [{
      title: 'Practice Mixed Difficulty',
      href: '/coding',
      note: 'Add a few hard questions to prepare for final interview rounds.',
    }] : []),
  ].slice(0, 3) : [];

  if (adaptiveRecommendations.length === 0 && stats) {
    adaptiveRecommendations.push({
      title: 'Keep Momentum',
      href: '/placement-hub',
      note: 'You are on track. Continue weekly resume + coding improvements.',
    });
  }

  return (
    <div className={`min-h-screen px-4 pb-10 pt-6 md:px-6 ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-black'}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
          <h1 className="text-3xl font-semibold">Personalized Dashboard</h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {session.user.name || 'User'}, this dashboard shows your secure analytics.
          </p>
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Data source: secure server-side API with authentication.
          </p>
        </section>

        {error && (
          <section className={`rounded-2xl border p-4 ${isDark ? 'border-white/15 bg-white/5 text-gray-300' : 'border-black/15 bg-white text-gray-700'}`}>
            {error}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          {[
            { label: 'Career Readiness', value: `${readinessScore}% (${readinessBand})` },
            { label: '🔥 Streak', value: `${stats?.currentStreak || 0} days` },
            { label: 'Total Submissions', value: stats?.totalSubmissions || 0 },
            { label: 'Solved', value: stats?.solvedCount || 0 },
            { label: 'Success Rate', value: `${stats?.successRate || 0}%` },
            { label: 'Resume Analyzer Uses', value: stats?.resumeStats?.analyzerUses || 0 },
            { label: 'Resume Builder Uses', value: stats?.resumeStats?.builderUses || 0 },
            {
              label: 'Last Login',
              value: stats?.activitySummary?.lastLoginAt ? new Date(stats.activitySummary.lastLoginAt).toLocaleString() : '--',
            },
          ].map((card) => (
            <article key={card.label} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{card.label}</p>
              <p className="mt-3 text-xl font-semibold">{loading ? 'Loading...' : card.value}</p>
            </article>
          ))}
        </section>

        {stats?.voiceInterviewSummary && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">AI Interview Analytics</h2>
              <Link
                href="/voice-interviewer"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
              >
                Start Interview
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sessions</p>
                <p className="mt-1 text-2xl font-semibold">{stats.voiceInterviewSummary.totalInterviews}</p>
              </article>
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Overall Avg</p>
                <p className="mt-1 text-2xl font-semibold">{stats.voiceInterviewSummary.averageOverallScore}%</p>
              </article>
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Intro Avg</p>
                <p className="mt-1 text-2xl font-semibold">{stats.voiceInterviewSummary.averageIntroScore}%</p>
              </article>
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Coding Avg</p>
                <p className="mt-1 text-2xl font-semibold">{stats.voiceInterviewSummary.averageCodingScore}%</p>
              </article>
            </div>

            {(stats.voiceInterviewSummary.trend || []).length > 0 && (
              <div className="mt-5">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={(stats.voiceInterviewSummary.trend || []).map((row, index) => ({
                      session: `S${index + 1}`,
                      overall: row.overallScore,
                      intro: row.introScore,
                      coding: row.codeScore,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                    <XAxis dataKey="session" stroke={isDark ? '#ffffff80' : '#00000080'} />
                    <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2} name="Overall %" />
                    <Line type="monotone" dataKey="intro" stroke="#10b981" strokeWidth={2} name="Intro %" />
                    <Line type="monotone" dataKey="coding" stroke="#f59e0b" strokeWidth={2} name="Coding %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {stats?.personal && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <h2 className="text-xl font-semibold">Personal Profile Analytics</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
                <p className="mt-2 text-sm font-semibold">{stats.personal.name || '--'}</p>
              </article>
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                <p className="mt-2 text-sm font-semibold break-all">{stats.personal.email || '--'}</p>
              </article>
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Joined</p>
                <p className="mt-2 text-sm font-semibold">{stats.personal.joinedAt ? new Date(stats.personal.joinedAt).toLocaleString() : '--'}</p>
              </article>
            </div>
          </section>
        )}

        {stats?.activitySummary && (
          <section className="grid gap-4 lg:grid-cols-2">
            <article className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <h2 className="text-xl font-semibold">Time & App Usage</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Time Spent</p>
                  <p className="mt-1 text-lg font-semibold">{stats.activitySummary.totalTimeSpentMinutes} min</p>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Question Runs</p>
                  <p className="mt-1 text-lg font-semibold">{stats.activitySummary.questionRunCount}</p>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Contest Actions</p>
                  <p className="mt-1 text-lg font-semibold">{stats.activitySummary.contestActionCount}</p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-90 text-left text-sm">
                  <thead>
                    <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                      <th className="py-2 pr-3 font-semibold">Top Page</th>
                      <th className="py-2 pr-3 font-semibold">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.activitySummary.topPages || []).slice(0, 8).map((row) => (
                      <tr key={`${row.path}-${row.visits}`} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <td className="py-2 pr-3">{row.path}</td>
                        <td className="py-2 pr-3">{row.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <h2 className="text-xl font-semibold">Recent Chatbot Searches</h2>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {(stats.activitySummary.chatbotSearches || []).slice(0, 20).map((item, idx) => (
                  <div key={`${item.at}-${idx}`} className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                    <p className="text-sm font-medium">{item.query}</p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{new Date(item.at).toLocaleString()}</p>
                  </div>
                ))}
                {(stats.activitySummary.chatbotSearches || []).length === 0 && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No chatbot searches yet.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {stats && weeklySeries.length > 0 && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">14-Day Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                <XAxis dataKey="day" stroke={isDark ? '#ffffff80' : '#00000080'} />
                <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                <Legend />
                <Line type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <h2 className="text-xl font-semibold">Difficulty Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Easy', value: stats?.byDifficulty?.easy || 0 },
                    { name: 'Medium', value: stats?.byDifficulty?.medium || 0 },
                    { name: 'Hard', value: stats?.byDifficulty?.hard || 0 },
                    { name: 'Unlabeled', value: stats?.byDifficulty?.unknown || 0 },
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {['#10b981', '#f59e0b', '#ef4444', '#6b7280'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <h2 className="text-xl font-semibold">Top Languages</h2>
            {!loading && (!stats?.byLanguage || stats.byLanguage.length === 0) ? (
              <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No language data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats?.byLanguage || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                  <XAxis dataKey="language" stroke={isDark ? '#ffffff80' : '#00000080'} />
                  <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                  <Bar dataKey="count" fill="#8b5cf6" name="Submissions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </article>
        </section>

        {stats?.sectionProgress && stats.sectionProgress.length > 0 && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">Section-Wise Progress</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Solved / Total by DSA section with recent 14-day momentum
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                <h3 className="text-sm font-semibold mb-3">Completion % by Section (Top 10)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={(stats.sectionProgress || []).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                    <XAxis dataKey="sectionLabel" stroke={isDark ? '#ffffff80' : '#00000080'} interval={0} angle={-20} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                    <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                    <Bar dataKey="completionRate" fill="#3b82f6" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              </article>

              <article className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                <h3 className="text-sm font-semibold mb-3">Recent 14-Day Solves by Section (Top 10)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={(stats.sectionProgress || []).slice().sort((a, b) => b.recentSolved14 - a.recentSolved14).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                    <XAxis dataKey="sectionLabel" stroke={isDark ? '#ffffff80' : '#00000080'} interval={0} angle={-20} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                    <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                    <Bar dataKey="recentSolved14" fill="#10b981" name="Solved (14d)" />
                  </BarChart>
                </ResponsiveContainer>
              </article>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-130 text-left text-sm">
                <thead>
                  <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                    <th className="py-2 pr-3 font-semibold">Section</th>
                    <th className="py-2 pr-3 font-semibold">Solved</th>
                    <th className="py-2 pr-3 font-semibold">Total</th>
                    <th className="py-2 pr-3 font-semibold">Completion</th>
                    <th className="py-2 pr-3 font-semibold">Solved (14d)</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.sectionProgress || []).slice(0, 20).map((row) => (
                    <tr key={row.sectionId} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                      <td className="py-2 pr-3">{row.sectionLabel}</td>
                      <td className="py-2 pr-3">{row.solved}</td>
                      <td className="py-2 pr-3">{row.total}</td>
                      <td className="py-2 pr-3">{row.completionRate}%</td>
                      <td className="py-2 pr-3">{row.recentSolved14}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold">What To Do Next</h2>
            <Link
              href="/placement-hub"
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
            >
              Explore Hub
            </Link>
          </div>
          <div className="space-y-2">
            {adaptiveRecommendations.slice(0, 3).map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`block rounded-lg border p-3 transition-all ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-black/5 hover:bg-black/10'}`}
              >
                <p className="font-medium">{item.title}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.note}</p>
              </Link>
            ))}
          </div>
        </section>

        {weakestSections.length > 0 && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">Weakest Sections Action Plan</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Focus low completion sections first for faster placement readiness.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {weakestSections.map((item) => (
                <article key={item.sectionId} className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                  <p className="text-sm font-semibold">{item.sectionLabel}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Completion: {item.completionRate}% ({item.solved}/{item.total})
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Recent 14d solved: {item.recentSolved14}</p>
                  <Link
                    href={`/coding?section=${encodeURIComponent(item.sectionId.toLowerCase())}`}
                    className={`mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
                  >
                    Practice This Section
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {weeklyPlanner.length > 0 && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">Auto Weekly Study Planner</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Personalized from your weak sections and recent 14-day activity ({recent14Total} submissions)
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {weeklyPlanner.map((item) => (
                <Link
                  key={`${item.day}-${item.focus}`}
                  href={item.href}
                  className={`rounded-xl border p-4 transition ${isDark ? 'border-white/10 bg-black/30 hover:bg-black/45' : 'border-black/10 bg-black/5 hover:bg-black/10'}`}
                >
                  <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.day}</p>
                  <h3 className="mt-1 text-sm font-semibold">{item.focus}</h3>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.goal}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {stats?.contestReports && stats.contestReports.length > 0 && (
          <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <h2 className="text-xl font-semibold">Contest Performance Reports</h2>
            <div className="mt-4 space-y-3">
              {stats.contestReports.map((report, index) => (
                <article
                  key={`${report.contestId || 'contest'}-${report.createdAt}-${index}`}
                  className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Rating: {report.rating}</p>
                    <p className={`text-xs ${report.timedOut ? 'text-rose-400' : isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {report.timedOut ? 'Time Exceeded' : 'Completed'}
                    </p>
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Accuracy: {report.acceptanceRate}% | Accepted: {report.acceptedCount}/{Math.max(1, report.attemptedCount)}
                  </p>
                  {report.suggestions.length > 0 && (
                    <ul className={`mt-2 list-disc space-y-1 pl-5 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {report.suggestions.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type AnalyticsData = {
  totalUsers: number;
  totalSubmissions: number;
  acceptanceRate: number;
  resumeAnalyzerUses: number;
  resumeBuilderUses: number;
  topLanguages: Array<{ language: string; count: number }>;
  difficultyMap: { easy: number; medium: number; hard: number; unknown: number };
  submissionsTrend: number[];
  users: Array<{
    email: string;
    createdAt: string;
    totalSubmissions: number;
    submissionsDays: number[];
  }>;
  contestUserStats: Array<{
    userId: string;
    email: string;
    contestsEnded: number;
    selectedTotal: number;
    attemptedTotal: number;
    acceptedTotal: number;
    averageLeaderboardScore: number;
  }>;
};

export default function AdminPage() {
  const { status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'contests' | 'score' | 'email'>('contests');
  const [selectedUser, setSelectedUser] = useState<AnalyticsData['contestUserStats'][0] | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    let alive = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load admin analytics');
        }

        const data = await response.json();
        const normalized = data?.metrics
          ? {
              totalUsers: data.metrics.totalUsers || 0,
              totalSubmissions: data.metrics.totalSubmissions || 0,
              acceptanceRate: data.metrics.acceptanceRate || 0,
              resumeAnalyzerUses: data.metrics.activity?.resumeAnalyzerUses || 0,
              resumeBuilderUses: data.metrics.activity?.resumeBuilderUses || 0,
              topLanguages: data.metrics.topLanguages || [],
              difficultyMap: data.metrics.difficultyMap || { easy: 0, medium: 0, hard: 0, unknown: 0 },
              submissionsTrend: Array.isArray(data.metrics.submissionsTrend)
                ? data.metrics.submissionsTrend.map((x: { count?: number }) => Number(x?.count || 0))
                : [],
              users: Array.isArray(data.users)
                ? data.users.map((u: { email?: string; created_at?: string }) => ({
                    email: String(u.email || ''),
                    createdAt: String(u.created_at || new Date().toISOString()),
                    totalSubmissions: 0,
                    submissionsDays: [],
                  }))
                : [],
              contestUserStats: Array.isArray(data.contestUserStats)
                ? data.contestUserStats.map((s: {
                    userId?: string;
                    email?: string;
                    contestsEnded?: number;
                    selectedTotal?: number;
                    attemptedTotal?: number;
                    acceptedTotal?: number;
                    averageLeaderboardScore?: number;
                  }) => ({
                    userId: String(s.userId || ''),
                    email: String(s.email || ''),
                    contestsEnded: Number(s.contestsEnded || 0),
                    selectedTotal: Number(s.selectedTotal || 0),
                    attemptedTotal: Number(s.attemptedTotal || 0),
                    acceptedTotal: Number(s.acceptedTotal || 0),
                    averageLeaderboardScore: Number(s.averageLeaderboardScore || 0),
                  }))
                : [],
            }
          : data;
        if (alive) {
          setAnalytics(normalized);
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Failed to load admin analytics');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadAnalytics();
    return () => {
      alive = false;
    };
  }, [status]);

  return (
    <main className={`min-h-screen px-4 pb-10 pt-4 md:px-6 ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-black'}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`rounded-3xl border p-6 md:p-8 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>Admin Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Operational View Across Users, Submissions, And Performance</h1>
          <p className={`mt-3 max-w-3xl text-sm md:text-base ${isDark ? 'text-white/75' : 'text-black/70'}`}>
            Monitor candidate activity via secure server-side API. Powered by admin-protected analytics endpoints.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contests" className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}>
              Open Contest Center
            </Link>
            <Link href="/dashboard" className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/20 bg-white hover:bg-black/5'}`}>
              User Dashboard
            </Link>
          </div>
        </section>

        {error && <section className="rounded-2xl border border-rose-300/40 bg-rose-200/10 p-4 text-sm text-rose-200">{error}</section>}

        {status !== 'authenticated' && !loading && (
          <section className="rounded-2xl border border-yellow-300/40 bg-yellow-200/10 p-4 text-sm text-yellow-200">
            Please sign in to view admin analytics.
          </section>
        )}

        {status === 'authenticated' && analytics && (
          <>
            <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Tracked Users', value: analytics.totalUsers },
                { label: 'Tracked Submissions', value: analytics.totalSubmissions },
                { label: 'Acceptance Rate', value: `${analytics.acceptanceRate}%` },
                { label: 'Resume Analyzer Uses', value: analytics.resumeAnalyzerUses },
                { label: 'Resume Builder Uses', value: analytics.resumeBuilderUses },
                { label: 'Loading State', value: loading ? 'Refreshing...' : 'Up to date' },
              ].map((card) => (
                <article key={card.label} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                  <p className={`text-xs uppercase tracking-[0.12em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>{card.label}</p>
                  <p className="mt-3 text-xl font-semibold">{card.value}</p>
                </article>
              ))}
            </section>

            {analytics.submissionsTrend && analytics.submissionsTrend.length > 0 && (
              <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                <h2 className="text-lg font-semibold mb-4">14-Day Submissions Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.submissionsTrend.map((count, idx) => ({ day: `Day ${idx + 1}`, submissions: count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                    <XAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                    <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                    <Legend />
                    <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Submissions" />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-2">
              <article className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                <h2 className="text-lg font-semibold">Top Languages</h2>
                {analytics.topLanguages && analytics.topLanguages.length === 0 ? (
                  <p className={`mt-3 text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>No submissions yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.topLanguages || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                      <XAxis dataKey="language" stroke={isDark ? '#ffffff80' : '#00000080'} />
                      <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                      <Bar dataKey="count" fill="#3b82f6" name="Submissions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </article>

              <article className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                <h2 className="text-lg font-semibold">Difficulty Distribution</h2>
                {analytics.difficultyMap && (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics.difficultyMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))}
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
                )}
              </article>
            </section>

            <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Contest User Outcomes (Admin)</h2>
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                    Leaderboard score + selected/attempted/accepted totals per user.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!analytics?.contestUserStats?.length) return;
                    setExporting(true);
                    try {
                      const headers = ['Email', 'Contests Ended', 'Selected', 'Attempted', 'Accepted', 'Avg Score'];
                      const rows = analytics.contestUserStats.map((r) => [
                        r.email,
                        r.contestsEnded,
                        r.selectedTotal,
                        r.attemptedTotal,
                        r.acceptedTotal,
                        r.averageLeaderboardScore.toFixed(2),
                      ]);
                      const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', `contest-analytics-${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } finally {
                      setExporting(false);
                    }
                  }}
                  disabled={!analytics?.contestUserStats?.length || exporting}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-white/20 bg-white/10 text-white/85 hover:bg-white/20 disabled:opacity-50' : 'border-black/20 bg-white text-black/85 hover:bg-black/5 disabled:opacity-50'}`}
                >
                  {exporting ? 'Exporting...' : '📥 Export CSV'}
                </button>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Search email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white placeholder-white/40' : 'border-black/15 bg-white text-black placeholder-black/40'}`}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'contests' | 'score' | 'email')}
                  className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                >
                  <option value="contests">Sort by: Contests Ended ↓</option>
                  <option value="score">Sort by: Avg Score ↓</option>
                  <option value="email">Sort by: Email A-Z</option>
                </select>
              </div>

              <div className="mb-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(analytics.contestUserStats || [])
                      .slice(0, 15)
                      .sort((a, b) => b.contestsEnded - a.contestsEnded)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff16' : '#00000010'} />
                    <XAxis
                      dataKey="email"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke={isDark ? '#ffffff80' : '#00000080'}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke={isDark ? '#ffffff80' : '#00000080'} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${isDark ? '#ffffff20' : '#00000020'}` }} />
                    <Legend />
                    <Bar dataKey="contestsEnded" fill="#3b82f6" name="Contests Ended" />
                    <Bar dataKey="acceptedTotal" fill="#10b981" name="Accepted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-170 text-left text-sm">
                  <thead>
                    <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                      <th className="py-2 pr-3 font-semibold">Email</th>
                      <th className="py-2 pr-3 font-semibold">Contests Ended</th>
                      <th className="py-2 pr-3 font-semibold">Selected</th>
                      <th className="py-2 pr-3 font-semibold">Attempted</th>
                      <th className="py-2 pr-3 font-semibold">Accepted</th>
                      <th className="py-2 pr-3 font-semibold">Avg Score</th>
                      <th className="py-2 pr-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics.contestUserStats || [])
                      .filter((r) =>
                        !searchQuery || r.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .sort((a, b) => {
                        if (sortBy === 'contests') return b.contestsEnded - a.contestsEnded;
                        if (sortBy === 'score') return b.averageLeaderboardScore - a.averageLeaderboardScore;
                        return a.email.localeCompare(b.email);
                      })
                      .slice(0, 20)
                      .map((row) => (
                        <tr key={`${row.userId}-${row.email}`} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                          <td className="py-2 pr-3">{row.email || 'unknown'}</td>
                          <td className="py-2 pr-3">{row.contestsEnded}</td>
                          <td className="py-2 pr-3">{row.selectedTotal}</td>
                          <td className="py-2 pr-3">{row.attemptedTotal}</td>
                          <td className="py-2 pr-3">{row.acceptedTotal}</td>
                          <td className="py-2 pr-3">{row.averageLeaderboardScore.toFixed(1)}</td>
                          <td className="py-2 pr-3">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(row)}
                              className={`text-xs underline ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className={`max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Contest History</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className={`text-xl font-semibold ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className={`rounded-lg border p-4 mb-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>User</p>
                    <p className="mt-1 font-semibold">{selectedUser.email}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Contests Ended</p>
                        <p className="mt-1 text-2xl font-bold">{selectedUser.contestsEnded}</p>
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Avg Score</p>
                        <p className="mt-1 text-2xl font-bold">{selectedUser.averageLeaderboardScore.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Accepted</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-600">{selectedUser.acceptedTotal}</p>
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Attempted</p>
                        <p className="mt-1 text-lg font-semibold">{selectedUser.attemptedTotal}</p>
                      </div>
                    </div>

                    <div className={`mt-3 rounded border p-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                      <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                        Success Rate: <strong>{selectedUser.attemptedTotal > 0 ? ((selectedUser.acceptedTotal / selectedUser.attemptedTotal) * 100).toFixed(1) : 0}%</strong>
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                        Avg Per Contest: <strong>{selectedUser.contestsEnded > 0 ? (selectedUser.acceptedTotal / selectedUser.contestsEnded).toFixed(1) : 0}</strong> accepted
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/15 bg-white hover:bg-black/5'}`}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <h2 className="text-lg font-semibold">Recent Users</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-130 text-left text-sm">
                  <thead>
                    <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                      <th className="py-2 pr-3 font-semibold">Email</th>
                      <th className="py-2 pr-3 font-semibold">Submissions</th>
                      <th className="py-2 pr-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.users && analytics.users.slice(0, 12).map((user) => (
                      <tr key={user.email} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <td className="py-2 pr-3">{user.email}</td>
                        <td className="py-2 pr-3">{user.totalSubmissions}</td>
                        <td className="py-2 pr-3">{new Date(user.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

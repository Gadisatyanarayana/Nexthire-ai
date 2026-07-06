'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  LayoutDashboard,
  Bell,
  Search,
  User,
  Zap,
  ArrowRight,
  BookOpen,
  History,
  MessageSquare
} from 'lucide-react';

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
    lastLogoutAt: string | null;
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

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  isDark: boolean;
};

const GOOGLE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString();
}

function rankLabel(value: number): string {
  if (value >= 85) return 'Excellent';
  if (value >= 65) return 'Strong';
  if (value >= 45) return 'Stable';
  return 'Needs Improvement';
}

function shortDayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StatCard({ label, value, hint, icon: Icon, isDark }: StatCardProps) {
  return (
    <article className="premium-card bg-background/40 backdrop-blur-xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/50">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-foreground/5 border border-foreground/10 text-foreground/75">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-foreground/60">{hint}</p>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  isDark,
  children,
}: {
  title: string;
  subtitle: string;
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <section className="premium-card bg-background/30 backdrop-blur-xs flex flex-col justify-between">
      <div>
        <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-xs text-foreground/50">{subtitle}</p>
      </div>
      <div className="mt-6 h-72 w-full">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

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

        const response = await resilientFetch('/api/dashboard/stats', undefined, {
          retries: 1,
          timeoutMs: 7000,
          retryDelayMs: 250,
        });

        const payload = (await response.json().catch(() => ({}))) as { stats?: DashboardStats; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load dashboard stats');
        }

        if (alive) {
          setStats((payload?.stats || payload) as DashboardStats);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      alive = false;
    };
  }, [session?.user?.email, status]);

  const weeklySeries = useMemo(() => {
    const raw = stats?.weeklyActivity || [];
    return raw.map((item, index) => {
      if (typeof item === 'number') {
        return {
          day: `D-${raw.length - index}`,
          count: Number(item || 0),
          label: `Day ${index + 1}`,
        };
      }
      return {
        day: shortDayLabel(item.day),
        count: Number(item.count || 0),
        label: item.day,
      };
    });
  }, [stats?.weeklyActivity]);

  const weeklyTotal = useMemo(() => {
    return weeklySeries.reduce((sum, item) => sum + item.count, 0);
  }, [weeklySeries]);

  const readinessScore = useMemo(() => {
    if (!stats) return 0;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          stats.successRate * 0.45 +
            Math.min(20, stats.currentStreak * 2.5) +
            Math.min(20, stats.solvedCount * 0.5) +
            Math.min(15, (stats.resumeStats?.analyzerUses || 0) * 2) +
            Math.min(10, (stats.resumeStats?.builderUses || 0) * 2)
        )
      )
    );
  }, [stats]);

  const difficultyData = useMemo(() => {
    const byDiff = stats?.byDifficulty || { easy: 0, medium: 0, hard: 0, unknown: 0 };
    return [
      { name: 'Easy', value: byDiff.easy },
      { name: 'Medium', value: byDiff.medium },
      { name: 'Hard', value: byDiff.hard },
      { name: 'Unknown', value: byDiff.unknown },
    ].filter((item) => item.value > 0);
  }, [stats?.byDifficulty]);

  const languageData = useMemo(() => {
    return (stats?.byLanguage || []).slice(0, 7).map((row) => ({
      language: row.language.toUpperCase(),
      count: row.count,
    }));
  }, [stats?.byLanguage]);

  const sectionData = useMemo(() => {
    return [...(stats?.sectionProgress || [])]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 7)
      .map((row) => ({
        label: row.sectionLabel,
        completion: row.completionRate,
        solved: row.solved,
      }));
  }, [stats?.sectionProgress]);

  const voiceTrendData = useMemo(() => {
    return (stats?.voiceInterviewSummary?.trend || []).slice(-10).map((row) => ({
      day: shortDayLabel(row.createdAt),
      overall: row.overallScore,
      intro: row.introScore,
      coding: row.codeScore,
    }));
  }, [stats?.voiceInterviewSummary?.trend]);

  const contestRows = useMemo(() => {
    return (stats?.contestReports || []).slice(0, 6);
  }, [stats?.contestReports]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <span className="text-sm font-semibold tracking-wide text-foreground/75">Loading Intelligence Workspace...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="premium-card max-w-md w-full text-center space-y-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-blue-dim border border-brand-blue/30 text-brand-blue mx-auto">
            <User className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Access Locked</h1>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Please authenticate to launch the personalized placement training command dashboard.
            </p>
          </div>
          <Link
            href="/auth/signin"
            className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:opacity-90"
          >
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground premium-glow-bg pb-16 pt-4 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumbs Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/50 tracking-wider uppercase">
            <LayoutDashboard className="h-4 w-4 text-brand-blue" />
            <span className="text-foreground/70">Console</span>
            <span>/</span>
            <span className="text-foreground">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg border border-foreground/10 bg-foreground/5 text-foreground/70 hover:bg-foreground/10 transition">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Command Center Header Panel */}
        <section className="premium-card relative overflow-hidden bg-background/50 backdrop-blur-md">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">STUDENT TRACK</span>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Performance Intelligence Workspace</h1>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-brand-green-glow bg-brand-green-dim/10 px-4 py-2 text-xs font-bold text-brand-green">
                <Zap className="h-4 w-4 animate-pulse text-brand-orange" />
                <span>ACTIVE SESSION PROFILE</span>
              </div>
            </div>
            
            <p className="text-sm md:text-base text-foreground/70 leading-relaxed max-w-4xl">
              Monitor key metrics driving your hiring potential. Track technical skill gaps, interview pace consistency, and alignment score outcomes on verified pipelines.
            </p>

            <div className="flex flex-wrap gap-4 border-t border-foreground/10 pt-5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground/50">Readiness score:</span>
                <span className="font-bold text-brand-blue">{loading ? '--' : `${readinessScore}%`}</span>
              </div>
              <span className="text-foreground/20 hidden md:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground/50">University standing:</span>
                <span className="font-bold text-brand-green">{rankLabel(readinessScore)}</span>
              </div>
              <span className="text-foreground/20 hidden md:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground/50">Last Login:</span>
                <span className="font-semibold text-foreground/80">{formatDateTime(stats?.activitySummary?.lastLoginAt || null)}</span>
              </div>
            </div>
          </div>
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-brand-blue-dim blur-3xl opacity-25 -z-10 rounded-full" />
        </section>

        {error && (
          <section className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-semibold text-brand-red">
            {error}
          </section>
        )}

        {/* Dynamic Metric Scorecards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Placement Readiness" value={loading ? '--' : `${readinessScore}%`} hint={rankLabel(readinessScore)} icon={Target} isDark={isDark} />
          <StatCard label="Current Streak" value={loading ? '--' : `${stats?.currentStreak || 0} Days`} hint="Practice streak active" icon={Flame} isDark={isDark} />
          <StatCard label="Sandbox Runs" value={loading ? '--' : String(stats?.totalSubmissions || 0)} hint="Code execution attempts" icon={Activity} isDark={isDark} />
          <StatCard label="Accepted Submissions" value={loading ? '--' : String(stats?.solvedCount || 0)} hint="DSA problems verified" icon={CheckCircle2} isDark={isDark} />
        </section>

        {/* Second Row Metric Scorecards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Success Ratio" value={loading ? '--' : `${stats?.successRate || 0}%`} hint="Execution pass rate" icon={TrendingUp} isDark={isDark} />
          <StatCard label="Activity Count" value={loading ? '--' : String(weeklyTotal)} hint="Events in last 14 days" icon={Sparkles} isDark={isDark} />
          <StatCard label="Oral Evaluations" value={loading ? '--' : String(stats?.voiceInterviewSummary?.totalInterviews || 0)} hint="Voice AI coach interactions" icon={Trophy} isDark={isDark} />
          <StatCard label="Workspace Minutes" value={loading ? '--' : `${stats?.activitySummary?.totalTimeSpentMinutes || 0}m`} hint="Aggregated platform focus" icon={Clock3} isDark={isDark} />
        </section>

        {/* Interactive Charts Panel */}
        <section className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Daily Activity Stream" subtitle="Aggregated event volume over the past 14 days" isDark={isDark}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySeries}>
                <defs>
                  <linearGradient id="activityGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                  labelFormatter={(label, payload) => {
                    if (!payload || payload.length === 0) return String(label);
                    const item = payload[0]?.payload as { label?: string };
                    return item?.label || String(label);
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#activityGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="DSA Submission Mix" subtitle="Verify difficulty distribution breakdown" isDark={isDark}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={60} label>
                  {difficultyData.map((entry, index) => (
                    <Cell key={`difficulty-${entry.name}`} fill={GOOGLE_COLORS[index % GOOGLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Languages & DSA Section Completion Charts */}
        <section className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Language Distribution" subtitle="Distribution of sandbox compile requests" isDark={isDark}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis type="category" dataKey="language" width={70} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#10b981" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Concept Strengths" subtitle="Topic-wise DSA validation progress" isDark={isDark}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis type="category" dataKey="label" width={100} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="completion" radius={[0, 4, 4, 0]} fill="#f59e0b" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Voice Coach Trends & Profiles */}
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <ChartCard title="Voice AI Interview Trends" subtitle="Evaluate conversational metrics (scoring out of 100)" isDark={isDark}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={voiceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="intro" stroke="#10b981" strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="coding" stroke="#ef4444" strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <section className="premium-card bg-background/40 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">Verified Student Record</h2>
              <p className="text-xs text-foreground/50">Core catalog synchronization markers</p>
              
              <div className="mt-5 space-y-3.5 text-sm">
                <div className="flex justify-between border-b border-foreground/5 pb-2">
                  <span className="text-foreground/50">Candidate Name</span>
                  <span className="font-semibold text-right">{stats?.personal?.name || '--'}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/5 pb-2">
                  <span className="text-foreground/50">Email Address</span>
                  <span className="font-semibold text-right truncate max-w-[160px]">{stats?.personal?.email || '--'}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/5 pb-2">
                  <span className="text-foreground/50">Registration Date</span>
                  <span className="font-semibold text-right">{formatDateTime(stats?.personal?.joinedAt || null)}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/5 pb-2">
                  <span className="text-foreground/50">Last Active Submission</span>
                  <span className="font-semibold text-right">{formatDateTime(stats?.latestSubmissionAt || null)}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/5 pb-2">
                  <span className="text-foreground/50">Prompt Actions</span>
                  <span className="font-semibold text-right">{stats?.activitySummary?.chatbotSearches?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-foreground/10 text-[10px] text-foreground/40 font-mono">
              VERIFIED IDENTIFICATION ID: {stats?.personal?.email || 'ANONYMOUS'}
            </div>
          </section>
        </section>

        {/* Page Usage & Assistant Logs */}
        <section className="grid gap-6 lg:grid-cols-2">
          <section className="premium-card bg-background/40 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand-blue" />
              <h2 className="text-base font-bold tracking-tight text-foreground">Active Focus Mapping</h2>
            </div>
            <p className="text-xs text-foreground/50 mt-1">Platform segments showing highest student utility minutes</p>
            
            <div className="mt-4 space-y-2">
              {(stats?.activitySummary?.topPages || []).slice(0, 5).map((row) => (
                <div
                  key={`${row.path}-${row.visits}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-2.5 hover:bg-foreground/10 transition"
                >
                  <p className="truncate text-xs font-mono text-foreground/75">{row.path}</p>
                  <span className="shrink-0 rounded-md bg-brand-blue-dim border border-brand-blue/20 px-2 py-0.5 text-2xs font-bold text-brand-blue">
                    {row.visits} Views
                  </span>
                </div>
              ))}
              {(stats?.activitySummary?.topPages || []).length === 0 && (
                <p className="text-xs text-foreground/40 italic py-4 text-center">No focus metrics captured.</p>
              )}
            </div>
          </section>

          <section className="premium-card bg-background/40 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-purple" />
              <h2 className="text-base font-bold tracking-tight text-foreground">Recent Coach Queries</h2>
            </div>
            <p className="text-xs text-foreground/50 mt-1">Evaluation hints requested by dynamic voice AI Assistant</p>
            
            <div className="mt-4 space-y-2">
              {(stats?.activitySummary?.chatbotSearches || []).slice(0, 3).map((row, index) => (
                <div
                  key={`${row.at}-${index}`}
                  className="rounded-xl border border-foreground/10 bg-foreground/5 p-3 hover:bg-foreground/10 transition"
                >
                  <p className="text-[10px] font-semibold font-mono text-foreground/45">{formatDateTime(row.at)}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-foreground/80 font-medium">"{row.query}"</p>
                </div>
              ))}
              {(stats?.activitySummary?.chatbotSearches || []).length === 0 && (
                <p className="text-xs text-foreground/40 italic py-4 text-center">No coach logs reported.</p>
              )}
            </div>
          </section>
        </section>

        {/* Contest Performance Grid */}
        <section className="premium-card bg-background/40 backdrop-blur-xs">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-brand-orange" />
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">OA Assessment Benchmarks</h2>
              <p className="text-xs text-foreground/50">Performance logs in formal Online Assessment mock rounds</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-foreground/50 border-b border-foreground/10 pb-2">
                  <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Date Time</th>
                  <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Target Rating</th>
                  <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Acceptance Index</th>
                  <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Pass Count</th>
                  <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Total Attempted</th>
                  <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Time Bounded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {contestRows.map((row, idx) => (
                  <tr key={`${row.createdAt}-${idx}`} className="hover:bg-foreground/2 transition-colors">
                    <td className="whitespace-nowrap py-3 pr-3 font-medium">{formatDateTime(row.createdAt)}</td>
                    <td className="py-3 pr-3 font-mono font-bold text-brand-blue">{row.rating}</td>
                    <td className="py-3 pr-3">
                      <span className="font-semibold text-foreground/90">{row.acceptanceRate}%</span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-brand-green">{row.acceptedCount}</td>
                    <td className="py-3 pr-3 font-mono">{row.attemptedCount}</td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.timedOut 
                          ? 'border border-red-500/20 bg-red-500/10 text-brand-red' 
                          : 'border border-green-500/20 bg-green-500/10 text-brand-green'
                      }`}>
                        {row.timedOut ? 'TIMED OUT' : 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contestRows.length === 0 && (
              <p className="text-xs text-foreground/40 italic py-6 text-center">No official OA assessment benchmarks exist yet.</p>
            )}
          </div>
        </section>

        {/* Quick Command Launcher */}
        <section className="premium-card bg-background/50 backdrop-blur-md">
          <h2 className="text-base font-bold tracking-tight text-foreground mb-4">Quick Module Launchers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/coding"
              className="premium-card bg-background/20 p-4 flex items-center justify-between text-sm hover:border-brand-blue/30 text-foreground transition group"
            >
              <div className="space-y-1">
                <span className="block font-bold">Coding Arena</span>
                <span className="text-2xs text-foreground/50">Practice DSA challenges</span>
              </div>
              <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-brand-blue group-hover:translate-x-1 transition" />
            </Link>
            
            <Link
              href="/contests"
              className="premium-card bg-background/20 p-4 flex items-center justify-between text-sm hover:border-brand-orange/30 text-foreground transition group"
            >
              <div className="space-y-1">
                <span className="block font-bold">Mock Contests</span>
                <span className="text-2xs text-foreground/50">Join Online Assessments</span>
              </div>
              <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-brand-orange group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/resume-analyzer"
              className="premium-card bg-background/20 p-4 flex items-center justify-between text-sm hover:border-brand-green/30 text-foreground transition group"
            >
              <div className="space-y-1">
                <span className="block font-bold">Resume Workspace</span>
                <span className="text-2xs text-foreground/50">Fix ATS formatting & gaps</span>
              </div>
              <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-brand-green group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/voice-interviewer"
              className="premium-card bg-background/20 p-4 flex items-center justify-between text-sm hover:border-brand-purple/30 text-foreground transition group"
            >
              <div className="space-y-1">
                <span className="block font-bold">Voice AI Coach</span>
                <span className="text-2xs text-foreground/50">Conduct live mock talks</span>
              </div>
              <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-brand-purple group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

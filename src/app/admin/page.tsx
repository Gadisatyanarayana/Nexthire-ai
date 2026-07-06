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
  BarChart3,
  Clock3,
  Crown,
  Download,
  Filter,
  LineChart as LineChartIcon,
  Search,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';

import { resilientFetch } from '@/lib/resilientFetch';

type AdminUser = {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  totalSubmissions: number;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  loginCount: number;
  logoutCount: number;
  totalPageTimeMinutes: number;
  chatbotPromptCount: number;
  aiCoachPromptCount: number;
  questionRunCount: number;
  questionSubmitCount: number;
  contestActionCount: number;
  recentActivities: Array<{
    type: string;
    source: string | null;
    at: string;
    payload: Record<string, unknown>;
  }>;
  recentPrompts: Array<{
    type: string;
    query: string;
    at: string;
    payload: Record<string, unknown>;
  }>;
};

type ContestUserStat = {
  userId: string;
  email: string;
  contestsEnded: number;
  selectedTotal: number;
  attemptedTotal: number;
  acceptedTotal: number;
  averageLeaderboardScore: number;
};

type AdminMetrics = {
  totalUsers: number;
  totalSubmissions: number;
  acceptanceRate: number;
  topLanguages: Array<{ language: string; count: number }>;
  difficultyMap: { easy: number; medium: number; hard: number; unknown: number };
  submissionsTrend: Array<{ day: string; count: number }>;
  activity: {
    resumeAnalyzerUses: number;
    resumeBuilderUses: number;
    loginLogoutTrend: Array<{ day: string; logins: number; logouts: number }>;
  };
  voiceInterviews: {
    total: number;
    averageOverallScore: number;
    averageIntroScore: number;
    averageCodingScore: number;
    trend: Array<{ day: string; overall: number; intro: number; coding: number }>;
  };
};

type AdminAnalytics = {
  metrics: AdminMetrics;
  users: AdminUser[];
  contestUserStats: ContestUserStat[];
};

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  isDark: boolean;
};

const CHART_COLORS = ['#1a73e8', '#188038', '#f9ab00', '#d93025', '#0f9d58', '#1967d2'];

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString();
}

function shortDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function activityLabel(lastActivityAt: string | null): string {
  if (!lastActivityAt) return 'No Activity';
  const diffHours = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60);
  if (diffHours <= 24) return 'Active Today';
  if (diffHours <= 72) return 'Recently Active';
  return 'Inactive';
}

function payloadPreview(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload || {});
  if (keys.length === 0) return '--';
  const compact = JSON.stringify(payload);
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact;
}

function statusBadgeClass(status: string, isDark: boolean): string {
  if (status === 'Active Today') {
    return isDark ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-emerald-700/20 bg-emerald-100 text-emerald-800';
  }
  if (status === 'Recently Active') {
    return isDark ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-amber-700/20 bg-amber-100 text-amber-800';
  }
  return isDark ? 'border-zinc-300/25 bg-zinc-300/10 text-zinc-200' : 'border-zinc-700/20 bg-zinc-200 text-zinc-800';
}

function roleBadgeClass(role: 'admin' | 'user', isDark: boolean): string {
  if (role === 'admin') {
    return isDark ? 'border-sky-300/35 bg-sky-300/10 text-sky-200' : 'border-sky-700/20 bg-sky-100 text-sky-900';
  }
  return isDark ? 'border-white/20 bg-white/10 text-white/90' : 'border-black/15 bg-black/5 text-black/80';
}

function downloadCsv(rows: AdminUser[]): void {
  const headers = [
    'Name',
    'Email',
    'Role',
    'User ID',
    'Joined At',
    'Last Activity At',
    'Status',
    'Total Submissions',
    'Question Runs',
    'Question Submits',
    'Contest Actions',
    'Logins',
    'Logouts',
    'Total Page Time Minutes',
    'Chatbot Prompts',
    'AI Coach Prompts',
  ];

  const lines = rows.map((row) => {
    const status = activityLabel(row.lastActivityAt);
    const values = [
      row.name || '--',
      row.email || '--',
      row.role,
      row.userId,
      formatDateTime(row.createdAt),
      formatDateTime(row.lastActivityAt),
      status,
      String(row.totalSubmissions),
      String(row.questionRunCount),
      String(row.questionSubmitCount),
      String(row.contestActionCount),
      String(row.loginCount),
      String(row.logoutCount),
      String(row.totalPageTimeMinutes),
      String(row.chatbotPromptCount),
      String(row.aiCoachPromptCount),
    ];

    return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-foreground/60">{hint}</p>
      </div>
    </article>
  );
}

function ChartPanel({
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

function normalizeUsers(rows: unknown): AdminUser[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((entry) => {
    const u = toRecord(entry);

    const recentActivities = Array.isArray(u.recentActivities)
      ? u.recentActivities.map((activity) => {
          const a = toRecord(activity);
          return {
            type: String(a.type || ''),
            source: a.source == null ? null : String(a.source),
            at: String(a.at || ''),
            payload: toRecord(a.payload),
          };
        })
      : [];

    const recentPrompts = Array.isArray(u.recentPrompts)
      ? u.recentPrompts.map((prompt) => {
          const p = toRecord(prompt);
          return {
            type: String(p.type || ''),
            query: String(p.query || ''),
            at: String(p.at || ''),
            payload: toRecord(p.payload),
          };
        })
      : [];

    return {
      userId: String(u.userId || ''),
      name: String(u.name || ''),
      email: String(u.email || ''),
      role: String(u.role || '').toLowerCase() === 'admin' ? 'admin' : 'user',
      createdAt: String(u.createdAt || ''),
      totalSubmissions: toNumber(u.totalSubmissions),
      lastActivityAt: u.lastActivityAt == null ? null : String(u.lastActivityAt),
      lastLoginAt: u.lastLoginAt == null ? null : String(u.lastLoginAt),
      lastLogoutAt: u.lastLogoutAt == null ? null : String(u.lastLogoutAt),
      loginCount: toNumber(u.loginCount),
      logoutCount: toNumber(u.logoutCount),
      totalPageTimeMinutes: toNumber(u.totalPageTimeMinutes),
      chatbotPromptCount: toNumber(u.chatbotPromptCount),
      aiCoachPromptCount: toNumber(u.aiCoachPromptCount),
      questionRunCount: toNumber(u.questionRunCount),
      questionSubmitCount: toNumber(u.questionSubmitCount),
      contestActionCount: toNumber(u.contestActionCount),
      recentActivities,
      recentPrompts,
    };
  });
}

function normalizeContestStats(rows: unknown): ContestUserStat[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((entry) => {
    const row = toRecord(entry);
    return {
      userId: String(row.userId || ''),
      email: String(row.email || ''),
      contestsEnded: toNumber(row.contestsEnded),
      selectedTotal: toNumber(row.selectedTotal),
      attemptedTotal: toNumber(row.attemptedTotal),
      acceptedTotal: toNumber(row.acceptedTotal),
      averageLeaderboardScore: toNumber(row.averageLeaderboardScore),
    };
  });
}

function normalizeMetrics(metricsValue: unknown, usersLength: number): AdminMetrics {
  const metrics = toRecord(metricsValue);
  const activity = toRecord(metrics.activity);
  const voice = toRecord(metrics.voiceInterviews);

  const topLanguages = Array.isArray(metrics.topLanguages)
    ? metrics.topLanguages.map((entry) => {
        const row = toRecord(entry);
        return {
          language: String(row.language || 'unknown'),
          count: toNumber(row.count),
        };
      })
    : [];

  const submissionsTrend = Array.isArray(metrics.submissionsTrend)
    ? metrics.submissionsTrend.map((entry) => {
        const row = toRecord(entry);
        return {
          day: String(row.day || ''),
          count: toNumber(row.count),
        };
      })
    : [];

  const loginLogoutTrend = Array.isArray(activity.loginLogoutTrend)
    ? activity.loginLogoutTrend.map((entry) => {
        const row = toRecord(entry);
        return {
          day: String(row.day || ''),
          logins: toNumber(row.logins),
          logouts: toNumber(row.logouts),
        };
      })
    : [];

  const voiceTrend = Array.isArray(voice.trend)
    ? voice.trend.map((entry) => {
        const row = toRecord(entry);
        return {
          day: String(row.day || ''),
          overall: toNumber(row.overall),
          intro: toNumber(row.intro),
          coding: toNumber(row.coding),
        };
      })
    : [];

  const difficultyRaw = toRecord(metrics.difficultyMap);

  return {
    totalUsers: toNumber(metrics.totalUsers) || usersLength,
    totalSubmissions: toNumber(metrics.totalSubmissions),
    acceptanceRate: toNumber(metrics.acceptanceRate),
    topLanguages,
    difficultyMap: {
      easy: toNumber(difficultyRaw.easy),
      medium: toNumber(difficultyRaw.medium),
      hard: toNumber(difficultyRaw.hard),
      unknown: toNumber(difficultyRaw.unknown),
    },
    submissionsTrend,
    activity: {
      resumeAnalyzerUses: toNumber(activity.resumeAnalyzerUses),
      resumeBuilderUses: toNumber(activity.resumeBuilderUses),
      loginLogoutTrend,
    },
    voiceInterviews: {
      total: toNumber(voice.total),
      averageOverallScore: toNumber(voice.averageOverallScore),
      averageIntroScore: toNumber(voice.averageIntroScore),
      averageCodingScore: toNumber(voice.averageCodingScore),
      trend: voiceTrend,
    },
  };
}

export default function AdminPage() {
  const { status } = useSession();

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'submissions' | 'logins' | 'email'>('recent');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Support/mailbox states
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [supportFetchError, setSupportFetchError] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [mailboxSearch, setMailboxSearch] = useState("");
  const [mailboxCategoryFilter, setMailboxCategoryFilter] = useState("all");

  const loadSupportMessages = async () => {
    try {
      setLoadingSupport(true);
      setSupportFetchError(null);
      const res = await fetch("/api/admin/support", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load support messages.");
      setSupportMessages(data.messages || []);
      if (data.messages && data.messages.length > 0) {
        setSelectedMessageId((prev) => {
          const exists = data.messages.some((m: any) => m.id === prev);
          return exists ? prev : data.messages[0].id;
        });
      } else {
        setSelectedMessageId(null);
      }
    } catch (err: any) {
      setSupportFetchError(err.message || "Failed to load support messages.");
    } finally {
      setLoadingSupport(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      void loadSupportMessages();
    }
  }, [status]);

  const deleteSupportMessage = async (id: string) => {
    if (!confirm("Are you sure you want to resolve/delete this message?")) return;
    try {
      const res = await fetch(`/api/admin/support?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete message.");
      await loadSupportMessages();
    } catch (err: any) {
      alert(err.message || "Failed to delete message.");
    }
  };

  const filteredMailboxMessages = useMemo(() => {
    const rows = supportMessages;
    const q = mailboxSearch.trim().toLowerCase();
    const cat = mailboxCategoryFilter;

    let out = rows;
    if (cat !== "all") {
      out = out.filter((m) => m.category === cat);
    }
    if (q) {
      out = out.filter((m) => [m.name, m.email, m.message].join(' ').toLowerCase().includes(q));
    }
    return out;
  }, [supportMessages, mailboxSearch, mailboxCategoryFilter]);

  const selectedMailboxMessage = useMemo(() => {
    return supportMessages.find((m) => m.id === selectedMessageId) || null;
  }, [supportMessages, selectedMessageId]);

  const pageSize = compactMode ? 18 : 10;

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

        const response = await resilientFetch('/api/admin/analytics', undefined, {
          retries: 1,
          timeoutMs: 30000,
          retryDelayMs: 250,
        });

        const payload = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load admin data');
        }

        const users = normalizeUsers(payload.users);
        const metrics = normalizeMetrics(payload.metrics, users.length);
        const contestUserStats = normalizeContestStats(payload.contestUserStats);

        if (alive) {
          setAnalytics({ metrics, users, contestUserStats });
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Failed to load admin data');
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

  const filteredUsers = useMemo(() => {
    const rows = analytics?.users || [];
    const q = searchQuery.trim().toLowerCase();

    const searched = q
      ? rows.filter((u) => [u.name, u.email, u.userId, u.role].join(' ').toLowerCase().includes(q))
      : rows;

    const sorted = [...searched].sort((a, b) => {
      if (sortBy === 'submissions') return b.totalSubmissions - a.totalSubmissions;
      if (sortBy === 'logins') return b.loginCount - a.loginCount;
      if (sortBy === 'email') return a.email.localeCompare(b.email);
      return (b.lastActivityAt || '').localeCompare(a.lastActivityAt || '');
    });

    return sorted;
  }, [analytics?.users, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, compactMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }

    const exists = selectedUserId && filteredUsers.some((u) => u.userId === selectedUserId);
    if (!exists) {
      setSelectedUserId(filteredUsers[0].userId);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(
    () => filteredUsers.find((u) => u.userId === selectedUserId) || null,
    [filteredUsers, selectedUserId]
  );

  const activeTodayCount = useMemo(() => {
    return (analytics?.users || []).filter((u) => activityLabel(u.lastActivityAt) === 'Active Today').length;
  }, [analytics?.users]);

  const adminUsersCount = useMemo(() => {
    return (analytics?.users || []).filter((u) => u.role === 'admin').length;
  }, [analytics?.users]);

  const submissionsTrendData = useMemo(() => {
    return (analytics?.metrics.submissionsTrend || []).map((row) => ({
      day: shortDay(row.day),
      count: row.count,
    }));
  }, [analytics?.metrics.submissionsTrend]);

  const loginLogoutTrendData = useMemo(() => {
    return (analytics?.metrics.activity.loginLogoutTrend || []).map((row) => ({
      day: shortDay(row.day),
      logins: row.logins,
      logouts: row.logouts,
    }));
  }, [analytics?.metrics.activity.loginLogoutTrend]);

  const topLanguageData = useMemo(() => {
    return (analytics?.metrics.topLanguages || []).slice(0, 8).map((row) => ({
      language: row.language.toUpperCase(),
      count: row.count,
    }));
  }, [analytics?.metrics.topLanguages]);

  const difficultyData = useMemo(() => {
    const diff = analytics?.metrics.difficultyMap || { easy: 0, medium: 0, hard: 0, unknown: 0 };
    return [
      { name: 'Easy', value: diff.easy },
      { name: 'Medium', value: diff.medium },
      { name: 'Hard', value: diff.hard },
      { name: 'Unknown', value: diff.unknown },
    ].filter((entry) => entry.value > 0);
  }, [analytics?.metrics.difficultyMap]);

  const voiceTrendData = useMemo(() => {
    return (analytics?.metrics.voiceInterviews.trend || []).slice(-14).map((row) => ({
      day: shortDay(row.day),
      overall: row.overall,
      intro: row.intro,
      coding: row.coding,
    }));
  }, [analytics?.metrics.voiceInterviews.trend]);

  const resumeUsageData = useMemo(() => {
    return [
      { name: 'Analyzer', count: analytics?.metrics.activity.resumeAnalyzerUses || 0 },
      { name: 'Builder', count: analytics?.metrics.activity.resumeBuilderUses || 0 },
    ];
  }, [analytics?.metrics.activity.resumeAnalyzerUses, analytics?.metrics.activity.resumeBuilderUses]);

  const topContestUsers = useMemo(() => {
    return [...(analytics?.contestUserStats || [])].sort((a, b) => b.contestsEnded - a.contestsEnded).slice(0, 6);
  }, [analytics?.contestUserStats]);

  const rowPaddingClass = compactMode ? 'py-2' : 'py-3';

  return (
    <main className="min-h-screen bg-background text-foreground premium-glow-bg pb-16 pt-4 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumbs Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/50 tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4 text-brand-blue" />
            <span className="text-foreground/70">Admin Console</span>
            <span>/</span>
            <span className="text-foreground">Analytics Hub</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-1.5 text-xs font-bold text-brand-purple">
            Platform Operator Mode
          </div>
        </div>

        <section className="premium-card relative overflow-hidden bg-background/50 backdrop-blur-md">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">PLATFORM INTEL</span>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">System Operator Console</h1>
              </div>
            </div>
            
            <p className="text-sm md:text-base text-foreground/70 leading-relaxed max-w-4xl">
              High-signal analytics for user activity, sandbox compilation requests, interview performance tracking, and core database quality checkpoints.
            </p>
          </div>
          <div className="absolute right-0 top-0 w-80 h-80 bg-brand-purple-dim blur-3xl opacity-20 -z-10 rounded-full" />
        </section>

        {/* ── macOS styled mailbox window ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Feedback & Bug Inbox</h2>
              <p className="text-xs text-foreground/50">Inbox of user-submitted bug reports, feature updates, and feedback messages.</p>
            </div>
            <button
              onClick={loadSupportMessages}
              disabled={loadingSupport}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/15 bg-white hover:bg-black/5'
              }`}
            >
              {loadingSupport ? "Refreshing..." : "Refresh Inbox"}
            </button>
          </div>

          <div
            className="rounded-2xl border overflow-hidden flex flex-col h-[500px]"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            {/* macOS Window Title Bar */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-primary)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 hover:opacity-85" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 hover:opacity-85" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 hover:opacity-85" />
              </div>
              <span className="text-xs font-mono text-foreground/45">mailbox.nexthire.ai</span>
              <div className="w-12" />
            </div>

            {/* Split view */}
            <div className="flex-1 flex min-h-0">
              
              {/* Left messages list */}
              <div
                className="w-1/3 flex flex-col border-r min-w-[280px]"
                style={{ borderColor: "var(--border-primary)" }}
              >
                {/* Search & filters */}
                <div className="p-3 border-b space-y-2 flex-shrink-0" style={{ borderColor: "var(--border-primary)" }}>
                  <input
                    type="text"
                    value={mailboxSearch}
                    onChange={(e) => setMailboxSearch(e.target.value)}
                    placeholder="Search messages..."
                    className={`h-9 w-full rounded-lg border px-3 text-xs outline-none ${
                      isDark
                        ? 'border-white/15 bg-black/40 text-white placeholder:text-white/40 focus:border-white/30'
                        : 'border-black/15 bg-white text-black placeholder:text-black/45 focus:border-black/40'
                    }`}
                  />
                  <div className="flex gap-1.5">
                    {[
                      { id: "all", label: "All" },
                      { id: "bug", label: "Bugs" },
                      { id: "update", label: "Updates" },
                      { id: "general", label: "General" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMailboxCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition ${
                          mailboxCategoryFilter === cat.id
                            ? "bg-brand-blue-dim/20 border-brand-blue/35 text-brand-blue"
                            : "border-foreground/5 bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List items */}
                <div className="flex-grow overflow-y-auto no-scrollbar">
                  {supportFetchError && (
                    <div className="p-4 text-center text-xs text-rose-400">{supportFetchError}</div>
                  )}
                  {filteredMailboxMessages.length === 0 && !loadingSupport && (
                    <div className="p-8 text-center text-xs text-foreground/50">No messages found.</div>
                  )}
                  {filteredMailboxMessages.map((msg) => {
                    const isSelected = msg.id === selectedMessageId;
                    const dateStr = new Date(msg.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                    const snippet = msg.message.length > 55 ? `${msg.message.slice(0, 55)}...` : msg.message;
                    
                    let categoryColor = "var(--brand-purple)";
                    if (msg.category === "bug") categoryColor = "var(--brand-red)";
                    else if (msg.category === "update") categoryColor = "var(--brand-green)";

                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessageId(msg.id)}
                        className={`p-3.5 border-b cursor-pointer transition-colors ${
                          isDark ? 'border-white/5' : 'border-black/5'
                        } ${isSelected ? (isDark ? 'bg-white/10' : 'bg-black/5') : 'hover:bg-foreground/5'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-xs truncate max-w-[130px]">{msg.name}</p>
                          <span className="text-[10px] text-foreground/45 whitespace-nowrap">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-md"
                            style={{
                              background: `${categoryColor}20`,
                              color: categoryColor,
                              border: `1px solid ${categoryColor}40`,
                            }}
                          >
                            {msg.category}
                          </span>
                          <span className="text-[10px] text-foreground/50 truncate max-w-[130px]">{msg.email}</span>
                        </div>
                        <p className="text-xs text-foreground/70 mt-1.5 line-clamp-2 leading-relaxed">
                          {snippet}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right content pane */}
              <div className="flex-1 flex flex-col min-w-0 bg-background/25">
                {selectedMailboxMessage ? (
                  <div className="flex-1 flex flex-col min-h-0 p-5">
                    <div
                      className="border-b pb-4 flex-shrink-0 flex items-start justify-between gap-4"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <div className="min-w-0">
                        <h3 className="text-base font-bold truncate">{selectedMailboxMessage.name}</h3>
                        <p className="text-xs text-foreground/60 truncate mt-0.5">{selectedMailboxMessage.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-foreground/50 font-mono">
                            Received: {new Date(selectedMailboxMessage.createdAt).toLocaleString()}
                          </span>
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: selectedMailboxMessage.category === 'bug' ? 'rgba(239,71,67,0.12)' : selectedMailboxMessage.category === 'update' ? 'rgba(0,184,163,0.12)' : 'rgba(163,113,247,0.12)',
                              color: selectedMailboxMessage.category === 'bug' ? 'var(--color-wrong)' : selectedMailboxMessage.category === 'update' ? 'var(--color-accepted)' : 'var(--brand-purple)',
                            }}
                          >
                            {selectedMailboxMessage.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`mailto:${selectedMailboxMessage.email}?subject=NextHire Support: Re: ${selectedMailboxMessage.category === 'bug' ? 'Bug Report' : selectedMailboxMessage.category === 'update' ? 'Feature Update' : 'Feedback'}`}
                          className={`btn border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${
                            isDark ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white' : 'border-black/15 bg-white hover:bg-black/5 text-black'
                          }`}
                        >
                          Reply Email
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteSupportMessage(selectedMailboxMessage.id)}
                          className="btn bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3 py-1.5 text-xs"
                        >
                          Resolve & Close
                        </button>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto pt-4 leading-relaxed text-sm text-foreground/90 whitespace-pre-wrap">
                      {selectedMailboxMessage.message}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="text-4xl mb-3" style={{ opacity: 0.15 }}>📬</div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                      No Message Selected
                    </p>
                    <p className="text-xs text-foreground/45 mt-1">
                      Choose a user message from the left list to view details or resolve it.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {error && (
          <section className={`rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-300/30 bg-rose-200/10 text-rose-300' : 'border-rose-300/50 bg-rose-100/50 text-rose-800'}`}>
            {error}
          </section>
        )}

        {status !== 'authenticated' && !loading && (
          <section className={`rounded-2xl border p-4 text-sm ${isDark ? 'border-yellow-300/40 bg-yellow-200/10 text-yellow-200' : 'border-yellow-300/60 bg-yellow-100/50 text-yellow-900'}`}>
            Please sign in with an admin account to view this page.
          </section>
        )}

        {status === 'authenticated' && analytics && (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <StatCard label="Total Users" value={String(analytics.metrics.totalUsers)} hint="Registered accounts" icon={Users} isDark={isDark} />
              <StatCard label="Admins" value={String(adminUsersCount)} hint="Privileged operators" icon={ShieldCheck} isDark={isDark} />
              <StatCard label="Active Today" value={String(activeTodayCount)} hint="Recent engagement" icon={Workflow} isDark={isDark} />
              <StatCard label="Submissions" value={String(analytics.metrics.totalSubmissions)} hint="All coding attempts" icon={BarChart3} isDark={isDark} />
              <StatCard label="Acceptance" value={`${analytics.metrics.acceptanceRate}%`} hint="Quality ratio" icon={LineChartIcon} isDark={isDark} />
              <StatCard label="Voice Sessions" value={String(analytics.metrics.voiceInterviews.total)} hint="Interview workload" icon={Crown} isDark={isDark} />
              <StatCard label="Resume Analyzer" value={String(analytics.metrics.activity.resumeAnalyzerUses)} hint="Resume diagnostics" icon={Clock3} isDark={isDark} />
              <StatCard label="Resume Builder" value={String(analytics.metrics.activity.resumeBuilderUses)} hint="Resume generation" icon={Clock3} isDark={isDark} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <ChartPanel title="Submission Trend" subtitle="Daily submission volume" isDark={isDark}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={submissionsTrendData}>
                    <defs>
                      <linearGradient id="adminSubmissionFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'} />
                    <XAxis dataKey="day" tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        color: isDark ? '#f9fafb' : '#111827',
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={2.4} fill="url(#adminSubmissionFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="Login vs Logout" subtitle="User session activity" isDark={isDark}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loginLogoutTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'} />
                    <XAxis dataKey="day" tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        color: isDark ? '#f9fafb' : '#111827',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="logins" stroke="#188038" strokeWidth={2.3} dot={false} />
                    <Line type="monotone" dataKey="logouts" stroke="#d93025" strokeWidth={2.3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <ChartPanel title="Top Languages" subtitle="Most active coding stacks" isDark={isDark}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLanguageData} layout="vertical" margin={{ top: 10, right: 18, left: 10, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <YAxis type="category" dataKey="language" width={70} tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        color: isDark ? '#f9fafb' : '#111827',
                      }}
                    />
                    <Bar dataKey="count" fill="#188038" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="Difficulty Distribution" subtitle="Submission spread by challenge level" isDark={isDark}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} innerRadius={52} label>
                      {difficultyData.map((entry, index) => (
                        <Cell key={`difficulty-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        color: isDark ? '#f9fafb' : '#111827',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartPanel>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <ChartPanel title="Voice Interview Quality" subtitle="Overall, intro, and coding score trajectory" isDark={isDark}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={voiceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'} />
                    <XAxis dataKey="day" tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        color: isDark ? '#f9fafb' : '#111827',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#1a73e8" strokeWidth={2.4} dot={false} />
                    <Line type="monotone" dataKey="intro" stroke="#188038" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="coding" stroke="#d93025" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                <h2 className="text-base font-semibold">Operational Snapshot</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Voice Overall Avg:</span> {analytics.metrics.voiceInterviews.averageOverallScore}%</p>
                  <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Voice Intro Avg:</span> {analytics.metrics.voiceInterviews.averageIntroScore}%</p>
                  <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Voice Coding Avg:</span> {analytics.metrics.voiceInterviews.averageCodingScore}%</p>
                  <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Resume Analyzer Uses:</span> {analytics.metrics.activity.resumeAnalyzerUses}</p>
                  <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Resume Builder Uses:</span> {analytics.metrics.activity.resumeBuilderUses}</p>
                </div>

                <div className="mt-4 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumeUsageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'} />
                      <XAxis dataKey="name" tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: isDark ? '#d4d4d8' : '#374151', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? '#111827' : '#ffffff',
                          border: 'none',
                          borderRadius: 12,
                          color: isDark ? '#f9fafb' : '#111827',
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {resumeUsageData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                  <label className="relative">
                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-white/45' : 'text-black/40'}`} />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by name, email, user id, or role"
                      className={`h-11 w-full rounded-lg border pl-10 pr-3 text-sm outline-none ${
                        isDark
                          ? 'border-white/15 bg-black/40 text-white placeholder:text-white/40 focus:border-white/30'
                          : 'border-black/15 bg-white text-black placeholder:text-black/45 focus:border-black/40'
                      }`}
                    />
                  </label>

                  <label className="relative">
                    <Filter className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-white/45' : 'text-black/40'}`} />
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as 'recent' | 'submissions' | 'logins' | 'email')}
                      className={`h-11 w-full rounded-lg border pl-10 pr-3 text-sm outline-none ${
                        isDark ? 'border-white/15 bg-black/40 text-white focus:border-white/30' : 'border-black/15 bg-white text-black focus:border-black/40'
                      }`}
                    >
                      <option value="recent">Sort: Recent Activity</option>
                      <option value="submissions">Sort: Most Submissions</option>
                      <option value="logins">Sort: Most Logins</option>
                      <option value="email">Sort: Email (A-Z)</option>
                    </select>
                  </label>

                  <label
                    className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm ${
                      isDark ? 'border-white/15 bg-black/40 text-white' : 'border-black/15 bg-white text-black'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(event) => setCompactMode(event.target.checked)}
                      className="h-4 w-4"
                    />
                    Compact Rows
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                    Showing {pagedUsers.length} of {filteredUsers.length} users
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => downloadCsv(filteredUsers)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/15 bg-white hover:bg-black/5'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Filtered CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCsv(pagedUsers)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/15 bg-white hover:bg-black/5'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Current Page CSV
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                        <th className="pb-3 pr-4 font-semibold">Name</th>
                        <th className="pb-3 pr-4 font-semibold">Email</th>
                        <th className="pb-3 pr-4 font-semibold">Role</th>
                        <th className="pb-3 pr-4 font-semibold">Joined</th>
                        <th className="pb-3 pr-4 font-semibold">Last Activity</th>
                        <th className="pb-3 pr-4 font-semibold">Status</th>
                        <th className="pb-3 pr-4 font-semibold">Submissions</th>
                        <th className="pb-3 pr-4 font-semibold">Logins</th>
                        <th className="pb-3 pr-4 font-semibold">Time (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map((user) => {
                        const isSelected = user.userId === selectedUserId;
                        const statusLabel = activityLabel(user.lastActivityAt);
                        return (
                          <tr
                            key={user.userId}
                            onClick={() => setSelectedUserId(user.userId)}
                            className={`cursor-pointer border-t transition-colors ${
                              isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
                            } ${isSelected ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
                          >
                            <td className={`${rowPaddingClass} pr-4 font-medium`}>{user.name || '--'}</td>
                            <td className={`${rowPaddingClass} pr-4`}>{user.email || '--'}</td>
                            <td className={`${rowPaddingClass} pr-4`}>
                              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${roleBadgeClass(user.role, isDark)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className={`${rowPaddingClass} pr-4`}>{formatDateTime(user.createdAt)}</td>
                            <td className={`${rowPaddingClass} pr-4`}>{formatDateTime(user.lastActivityAt)}</td>
                            <td className={`${rowPaddingClass} pr-4`}>
                              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(statusLabel, isDark)}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className={`${rowPaddingClass} pr-4`}>{user.totalSubmissions}</td>
                            <td className={`${rowPaddingClass} pr-4`}>{user.loginCount}</td>
                            <td className={`${rowPaddingClass} pr-4`}>{user.totalPageTimeMinutes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <p className={`mt-4 text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>No users matched your search.</p>
                )}

                {filteredUsers.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                          isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/15 bg-white hover:bg-black/5'
                        }`}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                          isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-black/15 bg-white hover:bg-black/5'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                  <h2 className="text-base font-semibold">Contest Leaders</h2>
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Top users by contests completed</p>
                  <div className="mt-3 space-y-2">
                    {topContestUsers.map((row, index) => (
                      <div
                        key={`${row.userId}-${index}`}
                        className={`rounded-xl border px-3 py-2 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}
                      >
                        <p className="truncate text-sm font-medium">{row.email || row.userId}</p>
                        <p className={`mt-0.5 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                          Contests: {row.contestsEnded} | Score Avg: {row.averageLeaderboardScore}
                        </p>
                      </div>
                    ))}
                    {topContestUsers.length === 0 && (
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>No contest summaries yet.</p>
                    )}
                  </div>
                </section>

                {selectedUser && (
                  <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                    <h2 className="text-base font-semibold">Selected User Details</h2>
                    <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {selectedUser.name || '--'} ({selectedUser.email || '--'})
                    </p>

                    <div className="mt-3 grid gap-2 text-sm">
                      <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>User ID:</span> {selectedUser.userId}</p>
                      <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Joined:</span> {formatDateTime(selectedUser.createdAt)}</p>
                      <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Last Login:</span> {formatDateTime(selectedUser.lastLoginAt)}</p>
                      <p><span className={isDark ? 'text-white/60' : 'text-black/60'}>Last Logout:</span> {formatDateTime(selectedUser.lastLogoutAt)}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className={`rounded-lg border p-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                        <p className={isDark ? 'text-white/60' : 'text-black/60'}>Submissions</p>
                        <p className="mt-1 text-sm font-semibold">{selectedUser.totalSubmissions}</p>
                      </div>
                      <div className={`rounded-lg border p-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                        <p className={isDark ? 'text-white/60' : 'text-black/60'}>Runs</p>
                        <p className="mt-1 text-sm font-semibold">{selectedUser.questionRunCount}</p>
                      </div>
                      <div className={`rounded-lg border p-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                        <p className={isDark ? 'text-white/60' : 'text-black/60'}>Submits</p>
                        <p className="mt-1 text-sm font-semibold">{selectedUser.questionSubmitCount}</p>
                      </div>
                      <div className={`rounded-lg border p-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                        <p className={isDark ? 'text-white/60' : 'text-black/60'}>Contest Actions</p>
                        <p className="mt-1 text-sm font-semibold">{selectedUser.contestActionCount}</p>
                      </div>
                    </div>
                  </section>
                )}
              </section>
            </section>

            {selectedUser && (
              <section className="grid gap-4 lg:grid-cols-2">
                <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                  <h2 className="text-base font-semibold">Recent User Activity</h2>
                  <div className="mt-3 max-h-80 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                          <th className="pb-2 pr-3 font-semibold">Time</th>
                          <th className="pb-2 pr-3 font-semibold">Type</th>
                          <th className="pb-2 pr-3 font-semibold">Source</th>
                          <th className="pb-2 pr-3 font-semibold">Payload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.recentActivities.map((row, idx) => (
                          <tr key={`${row.at}-${row.type}-${idx}`} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                            <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(row.at)}</td>
                            <td className="py-2 pr-3">{row.type || '--'}</td>
                            <td className="py-2 pr-3">{row.source || '--'}</td>
                            <td className="break-all py-2 pr-3">{payloadPreview(row.payload)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedUser.recentActivities.length === 0 && (
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>No recent activity records.</p>
                    )}
                  </div>
                </section>

                <section className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                  <h2 className="text-base font-semibold">Recent AI Prompts</h2>
                  <div className="mt-3 max-h-80 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={isDark ? 'text-white/65' : 'text-black/65'}>
                          <th className="pb-2 pr-3 font-semibold">Time</th>
                          <th className="pb-2 pr-3 font-semibold">Type</th>
                          <th className="pb-2 pr-3 font-semibold">Query</th>
                          <th className="pb-2 pr-3 font-semibold">Payload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.recentPrompts.map((row, idx) => (
                          <tr key={`${row.at}-${row.type}-${idx}`} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                            <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(row.at)}</td>
                            <td className="py-2 pr-3">{row.type || '--'}</td>
                            <td className="break-all py-2 pr-3">{row.query || '--'}</td>
                            <td className="break-all py-2 pr-3">{payloadPreview(row.payload)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedUser.recentPrompts.length === 0 && (
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>No prompt records yet.</p>
                    )}
                  </div>
                </section>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

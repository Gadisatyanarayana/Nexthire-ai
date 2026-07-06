'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { resilientFetch } from '@/lib/resilientFetch';
import { ChevronLeft } from 'lucide-react';

type ContestItem = {
  id: string;
  title: string;
  description: string | null;
  mode: 'public' | 'private';
  join_code: string;
  duration_minutes: number;
  status: string;
  starts_at: string | null;
  created_at: string;
};

type ContestResultSummary = {
  contestId: string;
  result: string;
  endedAt: string;
  attemptedCount: number;
  acceptedCount: number;
  selectedCount: number;
  rating: number;
};

type FormData = {
  title: string;
  description: string;
  mode: 'public' | 'private';
  startsAt: string;
  durationValue: number;
  durationUnit: 'minutes' | 'hours';
  category: 'coding' | 'sql' | 'aptitude' | 'combined';
};

const AUTO_RETRY_ATTEMPTS = 3;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryContestLoad(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('timed out') ||
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('temporary') ||
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('504')
  );
}

export default function ContestsPage() {
  const { status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loadingContests, setLoadingContests] = useState(false);
  const [joiningContest, setJoiningContest] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myContests, setMyContests] = useState<ContestItem[]>([]);
  const [publicContests, setPublicContests] = useState<ContestItem[]>([]);
  const [myContestResults, setMyContestResults] = useState<Record<string, ContestResultSummary>>({});
  const mountedRef = useRef(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    mode: 'public',
    startsAt: '',
    durationValue: 90,
    durationUnit: 'minutes',
    category: 'coding',
  });

  // Dynamic categories/subjects taxonomy states
  type Subsection = { id: string; label: string };
  type Category = { id: string; label: string; subsections: Subsection[] };
  type Taxonomy = {
    categories: Category[];
    difficulties: string[];
    companyTags: string[];
    topicTags: string[];
  };
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [selectedSubsections, setSelectedSubsections] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');

  async function trackContestActivity(action: string, payload: Record<string, unknown> = {}) {
    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'contest_action',
          source: 'contests-page',
          payload: { action, ...payload },
        }),
      });
    } catch {
      // Ignore analytics failures
    }
  }

  async function loadContests() {
    try {
      setLoadingContests(true);
      setError(null);
      let data: unknown = null;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < AUTO_RETRY_ATTEMPTS; attempt++) {
        try {
          const res = await resilientFetch('/api/contests?scope=mine', undefined, { retries: 1, timeoutMs: 7000, retryDelayMs: 250 });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as { error?: string }).error || 'Failed to load contests');
          }
          data = await res.json();
          lastError = null;
          break;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load contests';
          lastError = new Error(message);
          const canRetry = shouldRetryContestLoad(message);
          const isLastAttempt = attempt === AUTO_RETRY_ATTEMPTS - 1;

          if (!canRetry || isLastAttempt) break;

          const backoffMs = 500 * Math.pow(2, attempt);
          await delay(backoffMs);
        }
      }

      if (lastError) throw lastError;

      if (!mountedRef.current) return;
      const parsed = (data || {}) as {
        myContests?: ContestItem[];
        publicContests?: ContestItem[];
        myContestResults?: ContestResultSummary[];
      };
      const myList = Array.isArray(parsed.myContests) ? parsed.myContests : [];
      const publicList = Array.isArray(parsed.publicContests) ? parsed.publicContests : [];
      const myContestIds = new Set(myList.map((contest) => contest.id));

      setMyContests(myList);
      setPublicContests(publicList.filter((contest) => !myContestIds.has(contest.id)));
      const resultMap: Record<string, ContestResultSummary> = {};
      const list = Array.isArray(parsed.myContestResults) ? parsed.myContestResults : [];
      for (const item of list) {
        if (item?.contestId) resultMap[item.contestId] = item;
      }
      setMyContestResults(resultMap);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load contests';
      setError(message);
    } finally {
      if (mountedRef.current) setLoadingContests(false);
    }
  }

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadContests();
    return () => {
      mountedRef.current = false;
    };
  }, [status]);

  useEffect(() => {
    void trackContestActivity('view_contests_page');
  }, []);

  useEffect(() => {
    fetch('/api/questions/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setTaxonomy(data);
          // Pre-check all difficulties by default
          if (Array.isArray(data.difficulties)) {
            setSelectedDifficulties(data.difficulties);
          }
        }
      })
      .catch((err) => console.error('Failed to load taxonomy categories', err));
  }, []);

  function badgeClass(status: ContestItem['status']) {
    if (status === 'live') return isDark ? 'bg-emerald-300/20 text-emerald-200 border-emerald-300/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'scheduled' || status === 'upcoming') return isDark ? 'bg-emerald-300/20 text-emerald-200 border-emerald-300/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return isDark ? 'bg-white/10 text-white/75 border-white/15' : 'bg-black/5 text-black/70 border-black/10';
  }

  function statusLabel(status: ContestItem['status']) {
    if (status === 'scheduled' || status === 'upcoming') return 'live';
    return status;
  }

  async function handleCreateCustomContest(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Contest title is required');
      return;
    }
    if (!formData.startsAt.trim()) {
      setError('Contest start date and time are required');
      return;
    }

    const startsAtDate = new Date(formData.startsAt);
    if (!Number.isFinite(startsAtDate.getTime())) {
      setError('Contest start date and time must be valid');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const durationMinutes =
        formData.durationUnit === 'hours'
          ? Math.round(formData.durationValue * 60)
          : Math.round(formData.durationValue);

      if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 720) {
        setError('Contest duration must be between 5 and 720 minutes.');
        return;
      }

      const formattedDescription = formData.description.trim() || `Dynamic Round: ${selectedSubsections.slice(0, 5).join(', ')}`;

      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formattedDescription,
          mode: formData.mode,
          durationMinutes,
          startsAt: startsAtDate.toISOString(),
          config: {
            selectedSubsections,
            selectedDifficulties,
            selectedCompanies,
            selectedTopics,
            questionCount,
            selectionMode,
          }
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create contest');
      }
      if (data.contest) {
        setMyContests((prev) => [data.contest, ...prev]);
        void trackContestActivity('create_contest', {
          contestId: String(data.contest.id || ''),
          title: String(data.contest.title || '').slice(0, 120),
          mode: String(data.contest.mode || ''),
        });
        setSuccess(data.contest.mode === 'private' ? `Contest created! Join key: ${data.contest.join_code}` : 'Contest created successfully.');
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          mode: 'public',
          startsAt: '',
          durationValue: 90,
          durationUnit: 'minutes',
          category: 'coding',
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create contest');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinByCode() {
    try {
      setJoiningContest(true);
      setError(null);
      setSuccess(null);
      const res = await resilientFetch('/api/contests/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode }),
      }, { retries: 1, timeoutMs: 7000, retryDelayMs: 250 });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Invalid contest key');
      }
      if (data.contest) {
        const joinedContest = data.contest as ContestItem;
        setMyContests((prev) => {
          const existing = prev.some((item) => item.id === joinedContest.id);
          return existing ? prev : [joinedContest, ...prev];
        });
        setPublicContests((prev) => prev.filter((item) => item.id !== joinedContest.id));
        setJoinCode('');
        void trackContestActivity('join_contest', {
          contestId: String(data.contest.id || ''),
          joinCode: String(joinCode || '').slice(0, 24),
        });
        setSuccess(`Contest found: ${data.contest.title} (${data.contest.mode})`);
        window.location.href = `/contests/${joinedContest.id}`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to validate contest key');
    } finally {
      setJoiningContest(false);
    }
  }

  return (
    <main className={`min-h-screen px-4 pb-10 pt-4 md:px-6 ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-black'}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`rounded-3xl border p-6 md:p-8 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>Contest Center</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Run Weekly Challenges Like A Real Hiring Platform</h1>
          <p className={`mt-3 max-w-3xl text-sm md:text-base ${isDark ? 'text-white/75' : 'text-black/70'}`}>
            Create your own public or private contests, share a secret join key for invited candidates, and evaluate coding performance under time pressure.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/placement-hub" className={`rounded-xl border px-4 py-2 text-sm font-semibold flex items-center gap-1.5 ${isDark ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' : 'border-black/15 bg-white text-black hover:bg-black/5'}`}>
              <ChevronLeft className="w-4 h-4" /> Back to Hub
            </Link>
            <Link href="/coding" className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}>
              Practice Before Contest
            </Link>
            {status === 'authenticated' ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={creating || showForm}
                  onClick={() => setShowForm(true)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-black/20 bg-white text-black hover:bg-black/5'} ${creating ? 'opacity-60' : ''}`}
                >
                  Create Contest
                </button>
              </div>
            ) : (
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Sign in to create and manage your own contests.</p>
            )}
            <button
              type="button"
              onClick={() => {
                void loadContests();
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10' : 'border-black/15 bg-white text-black/80 hover:bg-black/5'}`}
            >
              Refresh
            </button>
          </div>
          {(error || success) && (
            <div className={`mt-3 flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-xs ${error ? (isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700') : isDark ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              <p className="flex-1">{error || success}</p>
              {error && (
                <button
                  type="button"
                  onClick={() => {
                    void loadContests();
                  }}
                  className={`rounded-lg border px-2.5 py-1 font-semibold ${isDark ? 'border-white/15 bg-black/20 text-white/85 hover:bg-white/10' : 'border-black/15 bg-white text-black hover:bg-black/5'}`}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <article className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Contests</h2>
                <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Owned contests, join keys, and recent results live here.</p>
              </div>
              <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>{loadingContests ? 'Syncing...' : `Total: ${myContests.length}`}</span>
            </div>
            {status !== 'authenticated' ? (
              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-white/10 bg-black/25 text-white/75' : 'border-black/10 bg-black/5 text-black/75'}`}>
                Sign in to view and create your own contests.
              </div>
            ) : loadingContests && myContests.length === 0 ? (
              <div className="space-y-3">
                {[0, 1, 2].map((idx) => (
                  <div key={`my-skel-${idx}`} className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                    <div className={`h-4 w-40 animate-pulse rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className={`h-3 w-3/4 animate-pulse rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <div className={`h-3 w-1/2 animate-pulse rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : myContests.length === 0 ? (
              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-white/10 bg-black/25 text-white/75' : 'border-black/10 bg-black/5 text-black/75'}`}>
                No owned contests yet. Create a public round for open practice or a private round for invited candidates only.
              </div>
            ) : (
              <div className="space-y-3">
                {myContests.map((contest) => (
                  <div key={contest.id} className={`relative rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                    {(() => {
                      const ended = myContestResults[contest.id];
                      return (
                        <>
                    <span className={`absolute right-4 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${contest.mode === 'private' ? (isDark ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700') : (isDark ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}`}>
                      {contest.mode}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 pr-20">
                      <p className="text-base font-semibold">{contest.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase backdrop-blur-sm ${ended ? (isDark ? 'bg-red-500/25 text-red-100' : 'bg-red-100 text-red-700') : badgeClass(contest.status)}`}>
                        {ended ? 'closed' : statusLabel(contest.status as ContestItem['status'])}
                      </span>
                    </div>
                    <div className={`mt-2 grid gap-2 text-xs md:grid-cols-2 ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                      <p>Duration: {contest.duration_minutes} min</p>
                      {contest.mode === 'private' && <p>Join Key: {contest.join_code}</p>}
                    </div>
                    {contest.description && (
                      <p className={`mt-2 text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>{contest.description}</p>
                    )}
                    {ended && (
                      <div className={`grid gap-2 text-xs md:grid-cols-4 ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                        <p>Selected: {ended.selectedCount}</p>
                        <p>Attempted: {ended.attemptedCount}</p>
                        <p>Accepted: {ended.acceptedCount}</p>
                        <p>Rating: {ended.rating}</p>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap justify-end gap-2 text-xs">
                      {contest.id ? (
                        <Link
                          href={ended ? `/contests/${contest.id}?view=results` : `/contests/${contest.id}`}
                          className={
                            isDark
                              ? 'inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-3 py-1 font-semibold text-white/85 hover:bg-white/10'
                              : 'inline-flex items-center rounded-lg border border-black/15 bg-white px-3 py-1 font-semibold text-black/85 hover:bg-black/5'
                          }
                        >
                          {ended ? 'See Results' : 'Open Contest Workspace'}
                        </Link>
                      ) : (
                        <span className={isDark ? 'text-rose-300' : 'text-rose-700'}>Contest id missing</span>
                      )}
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <h2 className="text-xl font-semibold">Join Private Contest</h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-white/75' : 'text-black/70'}`}>
              Enter the organizer-provided secret key to unlock a private round and add it to your contest list.
            </p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="EXAMPLE: NHAI-2026"
              className={`mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
            />
            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={!joinCode || joiningContest}
              className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
            >
              {joiningContest ? 'Validating…' : 'Validate And Join'}
            </button>
            <p className={`mt-3 text-xs ${isDark ? 'text-white/55' : 'text-black/55'}`}>
              Join keys are generated automatically when organizers create contests. Share them securely with invited candidates only.
            </p>

            <div className={`mt-5 border-t pt-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Public Contests</h3>
                <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>{loadingContests ? 'Refreshing…' : 'Visible to all users'}</span>
              </div>
              {loadingContests && publicContests.length === 0 ? (
                <div className="space-y-2">
                  {[0, 1].map((idx) => (
                    <div key={`public-skel-${idx}`} className={`rounded-xl border px-3 py-3 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                      <div className={`h-4 w-44 animate-pulse rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <div className={`mt-2 h-3 w-28 animate-pulse rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                    </div>
                  ))}
                </div>
              ) : publicContests.length === 0 ? (
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>No public contests scheduled right now. Check back later or create one for everyone.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {publicContests.map((contest) => (
                    <div key={`public-${contest.id}`} className={`rounded-xl border px-3 py-2 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                      <p className="text-sm font-semibold leading-snug">{contest.title}</p>
                      <p className={`mt-1 text-[11px] ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                        {contest.starts_at ? new Date(contest.starts_at).toLocaleString() : 'Flexible start'} • {contest.duration_minutes} min
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Link
                          href={`/contests/${contest.id}`}
                          className={
                            isDark
                              ? 'inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/85 hover:bg-white/10'
                              : 'inline-flex items-center rounded-lg border border-black/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-black/85 hover:bg-black/5'
                          }
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>

        {/* Custom Contest Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4">
            <div className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create Custom Contest</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`text-xl font-semibold ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustomContest} className="mt-5 space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Contest Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., JavaScript Basics Challenge"
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white placeholder-white/40' : 'border-black/15 bg-white text-black placeholder-black/40'}`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional contest details..."
                    rows={3}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white placeholder-white/40' : 'border-black/15 bg-white text-black placeholder-black/40'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/55' : 'text-black/55'}`}>
                    The contest timer starts from this scheduled date and time.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Contest Visibility *
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value === 'private' ? 'private' : 'public' })}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                  >
                    <option value="public">Public (visible to all users)</option>
                    <option value="private">Private (join key required)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Contest Duration *
                  </label>
                  <div className="mt-2 grid grid-cols-[1fr_140px] gap-2">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      required
                      value={formData.durationValue}
                      onChange={(e) => setFormData({ ...formData, durationValue: Number(e.target.value || 0) })}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                    />
                    <select
                      value={formData.durationUnit}
                      onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value === 'hours' ? 'hours' : 'minutes' })}
                      className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Checkbox Tree */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Select Syllabus & Question Sections *
                  </label>
                  {taxonomy ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto rounded-xl border p-3 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                      {taxonomy.categories.map((cat) => {
                        const allSubIds = cat.subsections.map(s => s.id);
                        const isAllChecked = allSubIds.length > 0 && allSubIds.every(id => selectedSubsections.includes(id));
                        const isSomeChecked = allSubIds.some(id => selectedSubsections.includes(id)) && !isAllChecked;

                        const toggleCategory = () => {
                          if (isAllChecked) {
                            setSelectedSubsections(prev => prev.filter(id => !allSubIds.includes(id)));
                          } else {
                            setSelectedSubsections(prev => Array.from(new Set([...prev, ...allSubIds])));
                          }
                        };

                        return (
                          <div key={cat.id} className="space-y-1.5">
                            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mt-2 border-b pb-1 border-black/5 dark:border-white/5">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                ref={(el) => {
                                  if (el) el.indeterminate = isSomeChecked;
                                }}
                                onChange={toggleCategory}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{cat.label}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pl-5 font-normal">
                              {cat.subsections.map((sub) => {
                                const checked = selectedSubsections.includes(sub.id);
                                const toggleSub = () => {
                                  if (checked) {
                                    setSelectedSubsections(prev => prev.filter(id => id !== sub.id));
                                  } else {
                                    setSelectedSubsections(prev => [...prev, sub.id]);
                                  }
                                };
                                return (
                                  <label key={sub.id} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={toggleSub}
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="truncate">{sub.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-center py-4 animate-pulse">Loading subjects taxonomy from database...</div>
                  )}
                </div>

                {/* Difficulties */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Difficulty Levels *
                  </label>
                  <div className="flex gap-4">
                    {['Easy', 'Medium', 'Hard'].map((diff) => {
                      const checked = selectedDifficulties.includes(diff);
                      const toggleDiff = () => {
                        if (checked) {
                          setSelectedDifficulties(prev => prev.filter(d => d !== diff));
                        } else {
                          setSelectedDifficulties(prev => [...prev, diff]);
                        }
                      };
                      return (
                        <label key={diff} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={toggleDiff}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{diff}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Selection Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      Question Selection *
                    </label>
                    <select
                      value={selectionMode}
                      onChange={(e) => setSelectionMode(e.target.value as any)}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                    >
                      <option value="auto">Auto-Select (Random matching)</option>
                      <option value="manual">Manual Selection (Workspace library)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      Questions Count *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      required
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.max(1, Math.min(25, Number(e.target.value || 1))))}
                      disabled={selectionMode === 'manual'}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white disabled:opacity-50' : 'border-black/15 bg-white text-black disabled:opacity-50'}`}
                    />
                  </div>
                </div>

                {/* Target Companies */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Filter Target Companies
                  </label>
                  {taxonomy && taxonomy.companyTags ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto rounded-lg border p-2 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                      {taxonomy.companyTags.map((comp) => {
                        const active = selectedCompanies.includes(comp);
                        const toggleComp = () => {
                          if (active) {
                            setSelectedCompanies(prev => prev.filter(c => c !== comp));
                          } else {
                            setSelectedCompanies(prev => [...prev, comp]);
                          }
                        };
                        return (
                          <button
                            key={comp}
                            type="button"
                            onClick={toggleComp}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${active ? 'bg-indigo-600 text-white' : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'}`}
                          >
                            {comp}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 animate-pulse">Loading companies...</div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <p className={`rounded-lg border p-3 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-300 bg-rose-100 text-rose-700'}`}>
                    {error}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${isDark ? 'border-white/20 text-white/70 hover:text-white' : 'border-black/20 text-black/70 hover:text-black'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white text-black hover:bg-white/90 disabled:opacity-60' : 'bg-black text-white hover:bg-black/90 disabled:opacity-60'}`}
                  >
                    {creating ? 'Creating…' : 'Create Contest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

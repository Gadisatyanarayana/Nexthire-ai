'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { resilientFetch } from '@/lib/resilientFetch';

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
  startDate: string;
  startTime: string;
};

export default function ContestsPage() {
  const { status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myContests, setMyContests] = useState<ContestItem[]>([]);
  const [myContestResults, setMyContestResults] = useState<Record<string, ContestResultSummary>>({});
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
  });

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

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    void trackContestActivity('view_contests_page');
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

  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;
    const loadContests = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await resilientFetch('/api/contests?scope=mine', undefined, { retries: 1, timeoutMs: 7000, retryDelayMs: 250 });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load contests');
        }
        const data = await res.json();
        if (!cancelled) {
          setMyContests(data.myContests || []);
          const resultMap: Record<string, ContestResultSummary> = {};
          const list = Array.isArray(data.myContestResults) ? (data.myContestResults as ContestResultSummary[]) : [];
          for (const item of list) {
            if (item?.contestId) resultMap[item.contestId] = item;
          }
          setMyContestResults(resultMap);
        }

      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load contests');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContests();
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function handleCreateCustomContest(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Contest title is required');
      return;
    }
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      if (startDateTime < new Date()) {
        setError('Start time must be in the future');
        return;
      }

      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          startsAt: startDateTime.toISOString(),
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
          startDate: new Date().toISOString().slice(0, 10),
          startTime: '10:00',
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
      setLoading(true);
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
        void trackContestActivity('join_contest', {
          contestId: String(data.contest.id || ''),
          joinCode: String(joinCode || '').slice(0, 24),
        });
        setSuccess(`Contest found: ${data.contest.title} (${data.contest.mode})`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to validate contest key');
    } finally {
      setLoading(false);
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
          </div>
          {(error || success) && (
            <p className={`mt-3 text-xs ${error ? 'text-red-500' : isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {error || success}
            </p>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <article className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Contests</h2>
              <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Total: {myContests.length}</span>
            </div>
            {status !== 'authenticated' ? (
              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-white/10 bg-black/25 text-white/75' : 'border-black/10 bg-black/5 text-black/75'}`}>
                Sign in to view and create your own contests.
              </div>
            ) : loading && myContests.length === 0 ? (
              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-white/10 bg-black/25 text-white/75' : 'border-black/10 bg-black/5 text-black/75'}`}>
                Loading your contests...
              </div>
            ) : myContests.length === 0 ? (
              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-white/10 bg-black/25 text-white/75' : 'border-black/10 bg-black/5 text-black/75'}`}>
                You have not created any contests yet. Use the Create Contest button above and enter full contest details.
              </div>
            ) : (
              <div className="space-y-3">
                {myContests.map((contest) => (
                  <div key={contest.id} className={`relative rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/25' : 'border-black/10 bg-black/5'}`}>
                    {(() => {
                      const ended = myContestResults[contest.id];
                      return (
                        <>
                    <span className={`absolute right-4 top-3 text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'text-white' : 'text-black'}`}>
                      {contest.mode}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 pr-20">
                      <p className="text-base font-semibold">{contest.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase backdrop-blur-sm ${ended ? (isDark ? 'bg-red-500/25 text-red-100' : 'bg-red-100 text-red-700') : badgeClass(contest.status)}`}>
                        {ended ? 'closed' : statusLabel(contest.status as ContestItem['status'])}
                      </span>
                    </div>
                    <div className={`mt-2 grid gap-2 text-xs ${contest.mode === 'private' ? 'md:grid-cols-3' : 'md:grid-cols-2'} ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                      <p>Duration: {contest.duration_minutes} min</p>
                      <p>Starts: {contest.starts_at ? new Date(contest.starts_at).toLocaleString() : 'Flexible start'}</p>
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
              Enter your organizer-provided secret key to unlock private rounds.
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
              disabled={!joinCode || loading}
              className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
            >
              {loading ? 'Validating…' : 'Validate And Join'}
            </button>
            <p className={`mt-3 text-xs ${isDark ? 'text-white/55' : 'text-black/55'}`}>
              Join keys are generated automatically when organizers create contests. Share them securely with invited candidates only.
            </p>
          </article>
        </section>

        {/* Custom Contest Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-140 flex items-center justify-center bg-black/50 p-4">
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

                {/* Start Date */}
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().slice(0, 10)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-black/15 bg-white text-black'}`}
                  />
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

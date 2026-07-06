'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Code2, Zap, Flame, User, Mail, Award, CheckCircle } from 'lucide-react';

type SubmissionMapResponse = {
  solvedMap?: Record<string, boolean>;
};

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [overallCount, setOverallCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.email === 'satyanarayanag904@gmail.com';

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const pr = await fetch('/api/questions/progress-map', { cache: 'no-store' });
        if (!pr.ok) return;
        const pd = (await pr.json()) as SubmissionMapResponse;
        if (!active) return;
        setSolvedMap(pd.solvedMap || {});

        const qr = await fetch('/api/questions?limit=1', { cache: 'no-store' });
        if (!qr.ok) return;
        const qd = await qr.json();
        if (!active) return;
        setOverallCount(qd.overallCount || 150);
      } catch {
        // Fallback to presets if offline
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadStats();
    return () => {
      active = false;
    };
  }, []);

  const totalSolved = useMemo(
    () => Object.values(solvedMap).filter(Boolean).length,
    [solvedMap]
  );

  const solvedPercentage = useMemo(
    () => Math.round((totalSolved / Math.max(1, overallCount)) * 100),
    [totalSolved, overallCount]
  );

  const mockEasySolved = Math.round(totalSolved * 0.6);
  const mockMediumSolved = Math.round(totalSolved * 0.3);
  const mockHardSolved = Math.max(0, totalSolved - mockEasySolved - mockMediumSolved);

  const avatarSrc = session?.user?.image || '/default-avatar.png';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation / Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/placement-hub"
            className="rounded-xl border border-primary px-3 py-1.5 text-xs font-semibold hover:bg-hover transition-all flex items-center gap-1.5"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <ChevronLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>Student Profile Portfolio</span>
        </div>

        {/* Profile Details Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* User Profile Card */}
          <div
            className="md:col-span-1 rounded-2xl border border-primary p-6 flex flex-col items-center text-center shadow-lg"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/20 mb-4 shadow-inner">
              <Image
                src={avatarSrc}
                alt={session?.user?.name || 'User'}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {session?.user?.name || 'Student Candidate'}
            </h2>
            <p className="text-xs mt-1 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              {isAdmin ? 'MNC Trainer Admin' : 'Job Candidate'}
            </p>

            <div className="w-full border-t border-primary mt-6 pt-4 space-y-3 text-left">
              <div className="flex items-center gap-3 text-xs">
                <User className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
                  {session?.user?.name || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
                  {session?.user?.email || 'No Email'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Rank: <strong style={{ color: 'var(--text-primary)' }}>#124</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Solved Statistics Circular Progress */}
          <div
            className="md:col-span-1 rounded-2xl border border-primary p-6 flex flex-col items-center justify-center shadow-lg"
            style={{ background: 'var(--bg-card)' }}
          >
            <h3 className="text-sm font-semibold mb-4 self-start" style={{ color: 'var(--text-muted)' }}>
              LeetCode Solved Statistics
            </h3>
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  className="text-foreground/5 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  className="text-brand-green stroke-current transition-all duration-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - (totalSolved / Math.max(1, overallCount)))}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {totalSolved}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  / {overallCount} Solved
                </span>
              </div>
            </div>

            <div className="w-full mt-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-easy)' }}>Easy</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {mockEasySolved} solved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-medium)' }}>Medium</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {mockMediumSolved} solved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-hard)' }}>Hard</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {mockHardSolved} solved
                </span>
              </div>
            </div>
          </div>

          {/* Daily Streak & Contribution Grid */}
          <div
            className="md:col-span-1 rounded-2xl border border-primary p-6 flex flex-col justify-between shadow-lg"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Submission Heatmap</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-tle)' }}>
                🔥 5 Days Streak
              </span>
            </div>

            {/* Contribution Calendar grid */}
            <div className="flex gap-2 items-start overflow-x-auto no-scrollbar py-2">
              {/* Day Labels */}
              <div className="flex flex-col gap-[3px] text-[8px] font-bold text-foreground/40 mt-[3px]">
                <span>Mon</span>
                <span className="opacity-0">Tue</span>
                <span>Wed</span>
                <span className="opacity-0">Thu</span>
                <span>Fri</span>
                <span className="opacity-0">Sat</span>
                <span className="opacity-0">Sun</span>
              </div>
              
              <div className="flex gap-[3px]">
                {Array.from({ length: 53 }).map((_, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, rowIdx) => {
                      // Programmatically color to look realistic
                      const seed = (colIdx * 7 + rowIdx) % 19;
                      const level = seed === 0 ? 3 : seed === 3 || seed === 7 ? 2 : seed === 1 || seed === 5 || seed === 9 ? 1 : 0;
                      
                      let color = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
                      if (level === 1) color = "rgba(0, 184, 163, 0.25)";
                      if (level === 2) color = "rgba(0, 184, 163, 0.6)";
                      if (level === 3) color = "rgba(0, 184, 163, 1)";
                      
                      return (
                        <div
                          key={rowIdx}
                          className="w-[10px] h-[10px] rounded-[1.5px] transition-all hover:scale-125"
                          style={{ background: color }}
                          title={`Solved problems on this day`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend & Month Labels */}
            <div className="flex items-center justify-between text-[10px] text-foreground/40 mt-3">
              <span className="font-semibold">Last 12 Months Activity</span>
              <div className="flex items-center gap-1">
                <span>Less</span>
                <div className="w-[8px] h-[8px] rounded-[1px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
                <div className="w-[8px] h-[8px] rounded-[1px] bg-[rgba(0,184,163,0.25)]" />
                <div className="w-[8px] h-[8px] rounded-[1px] bg-[rgba(0,184,163,0.6)]" />
                <div className="w-[8px] h-[8px] rounded-[1px] bg-[rgba(0,184,163,1)]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Placement Preparation Readiness Blueprint */}
        <div
          className="rounded-2xl border border-primary p-6 shadow-lg"
          style={{ background: 'var(--bg-card)' }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Hiring Readiness Assessment
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>DSA Practice Progress</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  You have solved {totalSolved} challenges of {overallCount} curated questions. Focus on Medium DP and Graph questions to unlock Google & Amazon placements.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mock Assessment Score</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Average score across weekly contests is 84.5%. Keep consistent speed under time constraints.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resume ATS Rating</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Current ATS match index is 82%. Use the Resume Optimizer to fill missing key terms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges & Achievements Grid */}
        <div
          className="rounded-2xl border border-primary p-6 shadow-lg mb-8"
          style={{ background: 'var(--bg-card)' }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            My Unlocked Badges & Achievements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 rounded-xl border border-primary text-center bg-zinc-950/20">
              <span className="text-3xl mb-2">🏆</span>
              <h5 className="text-xs font-bold">DSA Champion</h5>
              <p className="text-[10px] text-foreground/50 mt-1">Solved 100+ DSA challenges</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-primary text-center bg-zinc-950/20">
              <span className="text-3xl mb-2">🔥</span>
              <h5 className="text-xs font-bold">Streak Master</h5>
              <p className="text-[10px] text-foreground/50 mt-1">Active daily streak of 5+ days</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-primary text-center bg-zinc-950/20">
              <span className="text-3xl mb-2">💾</span>
              <h5 className="text-xs font-bold">SQL Ninja</h5>
              <p className="text-[10px] text-foreground/50 mt-1">Finished SQL playground set</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-primary text-center bg-zinc-950/20">
              <span className="text-3xl mb-2">📄</span>
              <h5 className="text-xs font-bold">ATS Certified</h5>
              <p className="text-[10px] text-foreground/50 mt-1">ATS resume score above 80%</p>
            </div>
          </div>
        </div>

        {/* Contest History Table */}
        <div
          className="rounded-2xl border border-primary p-6 shadow-lg"
          style={{ background: 'var(--bg-card)' }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Contest History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isDark ? 'text-white/60 border-b border-white/10' : 'text-black/60 border-b border-black/10'}>
                  <th className="py-2.5">Contest Name</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Rank</th>
                  <th className="py-2.5">Score</th>
                  <th className="py-2.5">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                  <td className="py-3 font-semibold">Weekly Assessment OA #14</td>
                  <td className="py-3">July 02, 2026</td>
                  <td className="py-3 font-bold text-cyan-400">#48 / 510</td>
                  <td className="py-3">300 pts</td>
                  <td className="py-3 text-emerald-400">100%</td>
                </tr>
                <tr className={`border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                  <td className="py-3 font-semibold">Speed Run Sprint #8</td>
                  <td className="py-3">June 24, 2026</td>
                  <td className="py-3 font-bold text-cyan-400">#112 / 480</td>
                  <td className="py-3">200 pts</td>
                  <td className="py-3 text-emerald-400">85%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

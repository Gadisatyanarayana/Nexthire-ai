'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  const handleProtectedClick = (path: string) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    router.push(path);
  };

  const heroStats = useMemo(
    () => [
      { label: 'Placement Workflows', value: '3 Core Modules' },
      { label: 'Resume Precision', value: 'ATS + Role Match' },
      { label: 'Student Focus', value: 'Internship to FTE' },
    ],
    []
  );

  return (
    <main className={`min-h-screen w-full ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <section className="relative overflow-hidden px-6 pb-16 pt-20 md:pt-28">
        <div
          className={`pointer-events-none absolute inset-0 opacity-100 ${
            isDark
              ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.09),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.07),transparent_40%)]'
              : 'bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.08),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(0,0,0,0.06),transparent_40%)]'
          }`}
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p
                className={`mb-4 inline-flex rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${
                  isDark ? 'border-white/20 bg-white/5 text-white/90' : 'border-black/20 bg-black/5 text-black/80'
                }`}
              >
                Industry App For Students
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                Placement-ready resume system built for serious outcomes.
              </h1>
              <p className={`mt-6 max-w-2xl text-base md:text-lg ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                NextHire AI combines resume workspace management, deep ATS analysis, and guided resume building in one
                monochrome professional platform designed for campus placements.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => handleProtectedClick('/resume-analyzer')}
                  className="glow-button group relative inline-flex items-center gap-2 rounded-xl bg-black px-8 py-4 text-base font-bold text-white transition hover:scale-105 dark:bg-white dark:text-black"
                >
                  <span>Analyze My Resume</span>
                  <span className="text-xl">→</span>
                  <div className="absolute inset-0 rounded-xl bg-black opacity-0 group-hover:opacity-10" />
                </button>
                <button
                  onClick={() => router.push('/placement-hub')}
                  className={`inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold transition hover:scale-105 ${
                    isDark ? 'border border-white/30 bg-white/5 text-white hover:bg-white/10' : 'border border-black/30 bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  <span>Open Placement Hub</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-5 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
                  }`}
                >
                  <p className={`text-xs uppercase tracking-[0.16em] ${isDark ? 'text-white/55' : 'text-black/55'}`}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
              
              <div className={`relative mt-4 flex items-center justify-center rounded-2xl border p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
              }`}>
                <div className="score-animate">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                    <circle cx="60" cy="60" r="55" fill="none" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeWidth="4" />
                    <circle
                      cx="60"
                      cy="60"
                      r="55"
                      fill="none"
                      stroke={isDark ? '#ffffff' : '#000000'}
                      strokeWidth="4"
                      strokeDasharray="240 345"
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dasharray 0.5s' }}
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="36" fontWeight="bold" fill={isDark ? '#ffffff' : '#000000'}>
                      76
                    </text>
                    <text x="60" y="82" textAnchor="middle" fontSize="11" fill={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}>
                      ATS SCORE
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-32 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold md:text-4xl mb-3">Three Products. One Placement Pipeline.</h2>
            <p className={`max-w-3xl text-base md:text-lg ${isDark ? 'text-white/70' : 'text-black/65'}`}>
              Every module is purpose-built for students applying to internships, off-campus roles, and entry-level
              engineering positions. Use them together or independently—your choice.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className={`group rounded-2xl border p-8 transition-all hover:border-white/30 ${isDark ? 'border-white/10 bg-white/3' : 'border-black/10 bg-black/3'}`}>
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>W</div>
              <h3 className="mt-4 text-xl font-semibold">My Resume Workspace</h3>
              <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Upload resumes, run instant ATS checks, view role-match snapshots, and create action plans—all in one clean dashboard.
              </p>
              <button
                onClick={() => handleProtectedClick('/my-resume')}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-900'
                }`}
              >
                Open Workspace →
              </button>
            </article>

            <article className={`group rounded-2xl border p-8 transition-all hover:border-white/30 ${isDark ? 'border-white/10 bg-white/3' : 'border-black/10 bg-black/3'}`}>
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>A</div>
              <h3 className="mt-4 text-xl font-semibold">Resume Analyzer</h3>
              <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Get ATS scores, keyword analysis, section scoring, and recruiter-aligned feedback. Understand exactly what hiring software sees.
              </p>
              <button
                onClick={() => handleProtectedClick('/resume-analyzer')}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-900'
                }`}
              >
                Analyze Resume →
              </button>
            </article>

            <article className={`group rounded-2xl border p-8 transition-all hover:border-white/30 ${isDark ? 'border-white/10 bg-white/3' : 'border-black/10 bg-black/3'}`}>
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>B</div>
              <h3 className="mt-4 text-xl font-semibold">AI Resume Builder</h3>
              <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Build from scratch with structured guidance, AI-powered suggestions, and multi-template export. Professional results in 15 minutes.
              </p>
              <button
                onClick={() => handleProtectedClick('/resume-builder')}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-900'
                }`}
              >
                Build Resume →
              </button>
            </article>

            <article className={`group rounded-2xl border p-8 transition-all hover:border-white/30 ${isDark ? 'border-white/10 bg-white/3' : 'border-black/10 bg-black/3'}`}>
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>I</div>
              <h3 className="mt-4 text-xl font-semibold">AI Interviewer</h3>
              <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Practice a timed technical interview with voice prompts, coding phase, and post-session analysis.
              </p>
              <button
                onClick={() => handleProtectedClick('/voice-interviewer')}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-900'
                }`}
              >
                Start Interview →
              </button>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`scroll-mt-32 px-6 py-20 ${isDark ? 'bg-white/2' : 'bg-black/2'}`}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl mb-3">How Students Use NextHire AI</h2>
            <p className={`max-w-2xl mx-auto text-base md:text-lg ${isDark ? 'text-white/70' : 'text-black/65'}`}>
              A clear six-step process from resume prep to job application—designed for placement season.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ['1', 'Step 1', 'Upload or build resume baseline'],
              ['2', 'Step 2', 'Run ATS and keyword-level analysis'],
              ['3', 'Step 3', 'Apply AI-guided rewrite improvements'],
              ['4', 'Step 4', 'Match with target job descriptions'],
              ['5', 'Step 5', 'Track readiness and interview checklist'],
              ['6', 'Step 6', 'Export final resume for applications'],
            ].map(([emoji, step, text]) => (
              <div
                key={step}
                className={`rounded-xl border p-6 transition-all hover:border-white/20 ${isDark ? 'border-white/10 bg-white/4' : 'border-black/10 bg-black/4'}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{emoji}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-[0.14em] mb-1 ${isDark ? 'text-white/55' : 'text-black/55'}`}>{step}</p>
                    <p className="text-base font-medium">{text}</p>
                  </div>
                </div>
              </div>
            ))}          </div>       </div>     </section>

      <section id="about" className="scroll-mt-32 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className={`rounded-3xl border p-8 md:p-12 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
            <div className="mb-8 flex items-start gap-3">
              <span className="text-4xl mt-1 font-bold">→</span>
              <div>
                <h2 className="text-3xl font-semibold md:text-4xl">Built For Placement Season</h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Why we built this, and what it does.</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                This platform is built for students in their final year preparing for campus placements. We have designed it with one goal: help you submit a resume that actually passes automated screening and impresses recruiters.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={`rounded-xl border p-5 ${isDark ? 'border-white/10 bg-white/4' : 'border-black/10 bg-black/4'}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span>✓</span> Recruiter-Aligned
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    ATS scoring, keyword analysis, and section feedback mirror what hiring systems actually see.
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDark ? 'border-white/10 bg-white/4' : 'border-black/10 bg-black/4'}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span>✔</span> Fast & Efficient
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Get ATS feedback in seconds, AI rewrites in minutes, and polished output ready to apply immediately.
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDark ? 'border-white/10 bg-white/4' : 'border-black/10 bg-black/4'}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span>→</span> Role-Specific
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Match your resume against actual job descriptions you are targeting for precision improvements.
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDark ? 'border-white/10 bg-white/4' : 'border-black/10 bg-black/4'}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span>✓</span> Student-Focused
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Built for internships, off-campus offers, and entry-level roles—not executives.
                  </p>
                </div>
              </div>

              <p className={`text-base leading-relaxed italic ${isDark ? 'text-white/70' : 'text-black/65'}`}>
                No visual noise. No decorative colors. Only the tools you need, exactly when you need them so you can focus on applying to jobs and getting offers.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                onClick={() => handleProtectedClick('/resume-builder')}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                  isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-900'
                }`}
              >
                Start Building Your Resume
              </button>
              <button
                onClick={() => handleProtectedClick('/resume-analyzer')}
                className={`rounded-xl border px-6 py-3 text-sm font-semibold transition ${
                  isDark ? 'border-white/25 bg-white/5 hover:bg-white/12' : 'border-black/25 bg-black/5 hover:bg-black/10'
                }`}
              >
                Analyze Your Resume
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className={`border-t px-6 py-12 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-slate-50'}`}>
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <p className="text-lg font-semibold">NEXTHIRE AI</p>
            <p className={`text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Student-first, placement-focused resume platform for campus placements.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">Navigation</p>
            <div className="space-y-2 text-sm">
              <a href="#features" className={`${isDark ? 'text-white/75 hover:text-white' : 'text-black/75 hover:text-black'}`}>Features</a>
              <a href="#how-it-works" className={`${isDark ? 'block text-white/75 hover:text-white' : 'block text-black/75 hover:text-black'}`}>How It Works</a>
              <a href="#about" className={`${isDark ? 'block text-white/75 hover:text-white' : 'block text-black/75 hover:text-black'}`}>About</a>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">Tools</p>
            <div className="space-y-2 text-sm">
              <button onClick={() => handleProtectedClick('/my-resume')} className={`${isDark ? 'text-white/75 hover:text-white' : 'text-black/75 hover:text-black'}`}>My Resume Workspace</button>
              <button onClick={() => handleProtectedClick('/resume-analyzer')} className={`${isDark ? 'block text-white/75 hover:text-white' : 'block text-black/75 hover:text-black'}`}>Resume Analyzer</button>
              <button onClick={() => handleProtectedClick('/resume-builder')} className={`${isDark ? 'block text-white/75 hover:text-white' : 'block text-black/75 hover:text-black'}`}>AI Resume Builder</button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">About</p>
            <p className={`text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Personalized analytics powered by Supabase, built for students in placement season.
            </p>
          </div>
        </div>

        <div className={`mx-auto mt-8 max-w-7xl border-t pt-6 text-xs ${isDark ? 'border-white/10 text-white/55' : 'border-black/10 text-black/55'}`}>
          © 2026 NextHire AI. Built for placement success.
        </div>
      </footer>
    </main>
  );
}

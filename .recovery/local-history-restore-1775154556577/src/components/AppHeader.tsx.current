'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Briefcase, FileText, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';

export function AppHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toolsOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [toolsOpen]);

  const homePrefix = pathname === '/' ? '' : '/';
  const isAuthRoute = pathname.startsWith('/auth');

  return (
    <header className={`fixed top-0 z-120 w-full border-b shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${isDark ? 'bg-black/92 border-white/10' : 'bg-white/92 border-black/10'} backdrop-blur-xl`}>
      <div className="w-full grid h-20 grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10 lg:px-16">
        <Link href="/" className={`justify-self-start text-2xl md:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          NEXTHIRE AI
        </Link>

        <nav className={`hidden md:flex items-center justify-center gap-6 lg:gap-10 text-sm lg:text-[1.02rem] leading-none font-semibold ${isDark ? 'text-white/85' : 'text-black/85'}`}>
          <Link href="/" className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>Home</Link>
          <Link href={`${homePrefix}#features`} className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>Features</Link>
          <Link href={`${homePrefix}#how-it-works`} className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>How It Works</Link>

          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => setToolsOpen((prev) => !prev)}
              className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}
            >
              Apps
            </button>
            {toolsOpen && (
              <div className={`absolute left-1/2 top-full z-140 mt-3 w-80 -translate-x-1/2 rounded-2xl ${isDark ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'} border p-2 shadow-2xl backdrop-blur-xl`}>
                <Link
                  href="/placement-hub"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <Sparkles className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Placement Hub</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>All student features in one guided page</span>
                  </span>
                </Link>
                <Link
                  href="/resume-analyzer"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <Sparkles className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Resume Analyzer</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>ATS scoring, strengths, and optimization guidance</span>
                  </span>
                </Link>
                <Link
                  href="/resume-builder"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <FileText className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>AI Resume Builder</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>Build polished resumes with section-by-section guidance</span>
                  </span>
                </Link>
                <Link
                  href="/my-resume"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <Briefcase className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>My Resume Workspace</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>Analyze resume-job match and improve role alignment</span>
                  </span>
                </Link>
                <Link
                  href="/coding"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <FileText className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Coding Platform</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>Practice questions with editor, run, and submit</span>
                  </span>
                </Link>
                <Link
                  href="/contests"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <Sparkles className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Contest Center</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>Public and private coding contests with join keys</span>
                  </span>
                </Link>
                <Link
                  href="/voice-interviewer"
                  onClick={() => setToolsOpen(false)}
                  className={`flex gap-3 rounded-xl p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition`}
                >
                  <Sparkles className={`mt-0.5 h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>AI Interviewer</span>
                    <span className={`block text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>Timed voice interview with coding phase and feedback</span>
                  </span>
                </Link>
              </div>
            )}
          </div>

          <Link href={`${homePrefix}#about`} className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>About</Link>
          <Link href="/placement-hub" className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>Placement Hub</Link>
          <Link href="/voice-interviewer" className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>AI Interviewer</Link>
          <Link href="/my-resume" className={`hover:${isDark ? 'text-white' : 'text-black'} transition`}>My Resume</Link>
        </nav>

        <div className="flex items-center justify-self-end gap-3 md:gap-5 pr-1">
          {status === 'loading' && !isAuthRoute && <div className={`h-10 w-24 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />}
          {status === 'unauthenticated' && !isAuthRoute && (
            <Link
              href="/auth/signin"
              className={`rounded-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'} px-4 py-2 text-sm font-semibold hover:opacity-90 transition`}
            >
              Get Started
            </Link>
          )}
          <ThemeToggle />
          <UserAvatarDropdown />
        </div>
      </div>
    </header>
  );
}

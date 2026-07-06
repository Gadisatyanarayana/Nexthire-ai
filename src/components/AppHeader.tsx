'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Briefcase, FileText, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';

export function AppHeader() {
  const { status } = useSession();
  const pathname = usePathname();
  const hideHeader = pathname !== '/';
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!toolsOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setToolsOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [toolsOpen]);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const homePrefix = pathname === '/' ? '' : '/';
  const isAuthRoute = pathname.startsWith('/auth');

  if (hideHeader) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 z-[120] w-full border-b transition-all duration-500 ${
        scrolled 
          ? 'border-foreground/10 shadow-xl backdrop-blur-xl' 
          : 'border-transparent bg-transparent'
      }`}
      style={scrolled ? { background: 'var(--bg-primary)', boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)' } : {}}
    >
      <div className="w-full grid h-20 grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8 lg:px-12">
        <Link href="/" className="justify-self-start text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          NEXTHIRE AI
        </Link>

        <nav className="hidden items-center justify-center gap-6 font-semibold leading-none text-foreground/80 md:flex lg:gap-10 lg:text-[1.02rem] text-sm">
          <Link href="/" className="transition hover:text-foreground">Home</Link>
          <Link href={`${homePrefix}#features`} className="transition hover:text-foreground">Features</Link>
          <Link href={`${homePrefix}#how-it-works`} className="transition hover:text-foreground">How It Works</Link>

          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => setToolsOpen((prev) => !prev)}
              className="transition hover:text-foreground"
            >
              Apps
            </button>
            {toolsOpen && (
              <div
                className="absolute left-1/2 top-full z-[140] mt-3 w-80 -translate-x-1/2 rounded-2xl border border-foreground/10 p-2 shadow-2xl lift-in"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <Link
                  href="/placement-hub"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <Sparkles className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Placement Hub</span>
                    <span className="block text-xs text-foreground/70">All student features in one guided page</span>
                  </span>
                </Link>
                <Link
                  href="/resume-analyzer"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <Sparkles className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Resume Analyzer</span>
                    <span className="block text-xs text-foreground/70">ATS scoring, strengths, and optimization guidance</span>
                  </span>
                </Link>
                <Link
                  href="/resume-builder"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <FileText className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">AI Resume Builder</span>
                    <span className="block text-xs text-foreground/70">Build polished resumes with section-by-section guidance</span>
                  </span>
                </Link>
                <Link
                  href="/my-resume"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <Briefcase className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">My Resume Workspace</span>
                    <span className="block text-xs text-foreground/70">Analyze resume-job match and improve role alignment</span>
                  </span>
                </Link>
                <Link
                  href="/coding"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <FileText className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Coding Platform</span>
                    <span className="block text-xs text-foreground/70">Practice questions with editor, run, and submit</span>
                  </span>
                </Link>
                <Link
                  href="/contests"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <Sparkles className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Contest Center</span>
                    <span className="block text-xs text-foreground/70">Public and private coding contests with join keys</span>
                  </span>
                </Link>
                <Link
                  href="/voice-interviewer"
                  onClick={() => setToolsOpen(false)}
                  className="flex gap-3 rounded-xl p-3 transition hover:bg-foreground/5"
                >
                  <Sparkles className="mt-0.5 h-5 w-5 text-foreground/80" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Live Voice AI Assistant</span>
                    <span className="block text-xs text-foreground/70">Real-time ask-anything voice assistant with natural responses</span>
                  </span>
                </Link>
              </div>
            )}
          </div>

          <Link href={`${homePrefix}#about`} className="transition hover:text-foreground">About</Link>
          <Link href="/placement-hub" className="transition hover:text-foreground">Placement Hub</Link>
          <Link href="/voice-interviewer" className="transition hover:text-foreground">Live Voice AI</Link>
          <Link href="/my-resume" className="transition hover:text-foreground">My Resume</Link>
        </nav>

        <div className="flex items-center justify-self-end gap-3 md:gap-4 pr-1">
          {!isAuthRoute && status !== 'authenticated' && (
            <Link
              href="/auth/signin"
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
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

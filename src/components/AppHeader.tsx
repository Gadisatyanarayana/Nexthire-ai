'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Briefcase, FileText, Sparkles } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';

export function AppHeader() {
  const { data: session, status } = useSession();
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
      className={`fixed top-0 z-[120] w-full border-b transition-all duration-300 ${
        scrolled 
          ? 'border-white/10 bg-[#030308]/95 shadow-xl' 
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="w-full grid h-20 grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8 lg:px-12">
        <Link href="/" className="justify-self-start text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          NEXTHIRE
        </Link>

        <nav className="hidden items-center justify-center gap-6 font-semibold leading-none text-foreground/80 md:flex lg:gap-10 lg:text-[1.02rem] text-sm">
          <Link href="/" className="transition hover:text-foreground">Home</Link>
          <Link href={`${homePrefix}#features`} className="transition hover:text-foreground">Features</Link>
          <Link href={`${homePrefix}#how-it-works`} className="transition hover:text-foreground">How It Works</Link>

          <Link href="/placement-hub" className="transition hover:text-foreground text-emerald-400">Placement Hub</Link>
          <Link href="/voice-interviewer" className="transition hover:text-foreground">Live Voice AI</Link>
          <Link href="/coding" className="transition hover:text-foreground">Coding</Link>
          <Link href={`${homePrefix}#about`} className="transition hover:text-foreground">About</Link>
        </nav>

        <div className="flex items-center justify-self-end gap-3 md:gap-4 pr-1">
          {!isAuthRoute && !session?.user && status !== 'authenticated' ? (
            <Link
              href="/auth/signin"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 text-sm font-bold transition-all shadow-lg hover:scale-105"
            >
              Sign In
            </Link>
          ) : (
            <UserAvatarDropdown />
          )}
        </div>
      </div>
    </header>
  );
}

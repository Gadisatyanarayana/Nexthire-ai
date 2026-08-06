'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';

export function AppHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const isWorkspaceRoute = 
    !pathname || 
    pathname.startsWith('/question') || 
    pathname.startsWith('/coding') ||
    pathname.startsWith('/aptitude') ||
    pathname.startsWith('/reasoning') ||
    pathname.startsWith('/verbal') ||
    pathname.startsWith('/system-design');
  if (isWorkspaceRoute) {
    return null;
  }

  const homePrefix = pathname === '/' ? '' : '/';
  const isAuthRoute = pathname ? pathname.startsWith('/auth') : false;

  return (
    <header className="sticky top-0 z-[120] w-full border-b transition-all duration-300 bg-[#0B0B0B] border-white/10 shadow-sm">
      <div className="w-full grid h-[64px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8 lg:px-12">
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

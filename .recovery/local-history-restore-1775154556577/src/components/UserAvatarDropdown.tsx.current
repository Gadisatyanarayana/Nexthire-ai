'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export function UserAvatarDropdown() {

  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);


  if (!session || !session.user) {
    return null;
  }

  const avatarSrc = session.user.image || '/default-avatar.png';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`h-11 w-11 overflow-hidden rounded-full border-2 shadow-sm transition focus:outline-none ${isDark ? 'border-white/30 hover:border-white/50' : 'border-black/30 hover:border-black/50'}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        type="button"
      >
        <Image
          src={avatarSrc}
          alt={session.user.name || 'User'}
          width={44}
          height={44}
          unoptimized
          className="h-full w-full object-cover"
        />
      </button>
      {open && (
        <div className={`absolute right-0 z-140 mt-3 w-84 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${isDark ? 'border-white/25 bg-black/96' : 'border-black/20 bg-white/96'}`}>
          <div className={`px-4 py-4 ${isDark ? 'border-b border-white/15' : 'border-b border-black/10'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={avatarSrc}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                unoptimized
                className={`h-10 w-10 shrink-0 rounded-full object-cover ${isDark ? 'border border-white/25' : 'border border-black/15'}`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-foreground text-sm truncate">{session.user.name || 'User'}</div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isAdmin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40' : 'bg-slate-500/10 text-slate-300 border border-slate-500/40'}`}>
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="text-xs text-foreground/70 truncate">{session.user.email || 'No email'}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col py-2">
            <Link href="/profile" className="px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors">Profile</Link>
            <Link href="/settings" className="px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors">Settings</Link>
            <Link href="/dashboard" className="px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors">Dashboard</Link>
            <Link href="/resume-analyzer" className="px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors">Resume Analyzer</Link>
            <Link href="/resume-builder" className="px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors">Resume Builder</Link>
            {isAdmin && (
              <Link href="/admin" className="px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors">
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={async () => { setOpen(false); await signOut({ redirect: true, callbackUrl: "/" }); }}
              className={`mt-1 px-4 py-2.5 text-left text-sm text-foreground/90 transition-colors hover:bg-foreground/10 ${isDark ? 'border-t border-white/15' : 'border-t border-black/10'}`}
            >Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

const ACTIVITY_SESSION_KEY = 'nexthire:activity-session-id';
const LOGOUT_SENT_PREFIX = 'nexthire:activity-logout-sent:';

function getActivitySessionId() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACTIVITY_SESSION_KEY);
}

function logoutSentKey(sessionId: string) {
  return `${LOGOUT_SENT_PREFIX}${sessionId}`;
}

async function trackLogout(pathname: string | null) {
  const sessionId = getActivitySessionId();
  if (!sessionId || sessionStorage.getItem(logoutSentKey(sessionId))) return;

  sessionStorage.setItem(logoutSentKey(sessionId), '1');

  try {
    await fetch('/api/activity/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityType: 'logout',
        source: 'user-avatar-dropdown',
        payload: {
          path: pathname || '/',
          at: new Date().toISOString(),
          sessionId,
        },
      }),
      keepalive: true,
    });
  } catch {
    // Logout telemetry is best-effort only.
  }
}

export function UserAvatarDropdown() {

  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = session?.user?.email === 'satyanarayanag904@gmail.com';

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

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);


  if (!session || !session.user) {
    return null;
  }

  const avatarSrc = session.user.image || '/default-avatar.png';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="h-11 w-11 overflow-hidden rounded-full border-2 border-foreground/25 shadow-sm transition focus:outline-none hover:border-foreground/45"
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
        <div
          className="absolute right-0 z-[200] mt-3 w-84 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 border-foreground/15 shadow-2xl"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="border-b border-foreground/10 px-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={avatarSrc}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 shrink-0 rounded-full border border-foreground/15 object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-foreground text-sm truncate">{session.user.name || 'User'}</div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${isAdmin ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' : 'border-foreground/15 bg-foreground/5 text-foreground/70'}`}>
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="text-xs text-foreground/70 truncate">{session.user.email || 'No email'}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col py-2">
            <Link href="/profile" className="px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5">Profile</Link>
            <Link href="/settings" className="px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5">Settings</Link>
            <Link href="/dashboard" className="px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5">Dashboard</Link>
            <Link href="/resume-analyzer" className="px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5">Resume Analyzer</Link>
            <Link href="/resume-builder" className="px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5">Resume Builder</Link>
            {isAdmin && (
              <Link href="/admin" className="px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5">
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={async () => {
                setOpen(false);
                await trackLogout(pathname);
                sessionStorage.removeItem(ACTIVITY_SESSION_KEY);
                await signOut({ redirect: true, callbackUrl: "/" });
              }}
              className="mt-1 border-t border-foreground/10 px-4 py-2.5 text-left text-sm text-foreground/90 transition-colors hover:bg-foreground/5"
            >Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}

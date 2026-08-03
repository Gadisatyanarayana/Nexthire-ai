'use client';

import Link from 'next/link';
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

  const avatarSrc = session.user.image || '/google-user.svg';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="h-11 w-11 overflow-hidden rounded-full border-2 border-emerald-400/70 shadow-lg transition-all focus:outline-none hover:scale-105 flex items-center justify-center bg-black/80"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        type="button"
        title={session.user.name || 'User Profile'}
      >
        <img
          src={avatarSrc}
          alt={session.user.name || 'User Profile'}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/google-user.svg';
          }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-[200] mt-3 w-84 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 border-foreground/15 shadow-2xl"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="border-b border-foreground/10 px-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 shrink-0 rounded-full border border-foreground/20 overflow-hidden bg-black">
                <img
                  src={avatarSrc}
                  alt={session.user.name || 'User'}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/google-user.svg';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-foreground text-sm truncate">{session.user.name || 'User'}</div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${isAdmin ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' : 'border-foreground/15 bg-foreground/5 text-foreground/70'}`}>
                    <img src="/google-user.svg" alt="Google" className="w-3.5 h-3.5 shrink-0" />
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="text-xs text-foreground/60 truncate">{session.user.email}</div>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1 text-sm font-medium">
            <Link
              href="/coding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-foreground/10 text-foreground transition"
            >
              Coding Platform
            </Link>
            <Link
              href="/placement-hub"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-foreground/10 text-foreground transition"
            >
              Placement Hub
            </Link>
            <Link
              href="/admin/coding-audit"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-foreground/10 text-foreground transition text-emerald-400 font-bold"
            >
              QA Audit Dashboard
            </Link>
          </div>

          <div className="p-2 border-t border-foreground/10">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

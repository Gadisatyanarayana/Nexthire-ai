'use client';

import { useEffect } from 'react';
import type { Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';

const USER_SYNC_KEY_PREFIX = 'nexthire:user-sync:';

function makeSyncKey(email: string) {
  return `${USER_SYNC_KEY_PREFIX}${email.toLowerCase()}`;
}

function SyncUserOnLogin() {
  const { data: session, status } = useSession();
  const email = typeof session?.user?.email === 'string' ? session.user.email.trim().toLowerCase() : '';

  useEffect(() => {
    if (status === 'authenticated' && email && session?.user) {
      const syncKey = makeSyncKey(email);
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(syncKey) === '1') {
        return;
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4500);

      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: session?.user?.name,
          email,
        }),
        signal: controller.signal,
        keepalive: true,
      })
        .then(() => {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(syncKey, '1');
          }
        })
        .catch(() => {
          // Best-effort sync; avoid noisy startup failures in dev cold boot.
        })
        .finally(() => {
          window.clearTimeout(timeoutId);
        });

      return () => {
        window.clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [status, email, session?.user?.name]);

  return null; // This component doesn't render anything
}

export function SessionWrapper({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <SyncUserOnLogin />
      {children}
    </SessionProvider>
  );
}

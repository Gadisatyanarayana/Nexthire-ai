'use client';

import { useEffect } from 'react';
import type { Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';

function SyncUserOnLogin() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Auto-sync user to database on login
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: session.user.name,
          email: session.user.email,
        }),
      }).catch((err) => console.error('Failed to sync user:', err));
    }
  }, [status, session]);

  return null; // This component doesn't render anything
}

export function SessionWrapper({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <SyncUserOnLogin />
      {children}
    </SessionProvider>
  );
}

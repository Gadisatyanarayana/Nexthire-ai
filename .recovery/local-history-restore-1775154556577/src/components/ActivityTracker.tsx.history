'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

type TrackPayload = {
  activityType: string;
  source?: string;
  payload?: Record<string, unknown>;
};

function postTrackEvent(data: TrackPayload, useBeacon = false) {
  const body = JSON.stringify(data);
  if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/activity/track', blob);
    return;
  }

  void fetch('/api/activity/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function ActivityTracker() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const pageStartRef = useRef<number>(0);
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const loginKey = `nexthire:login:${String(session.user.email).toLowerCase()}:${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(loginKey)) {
      postTrackEvent({
        activityType: 'login',
        source: 'session-wrapper',
        payload: {
          path: pathname,
          at: new Date().toISOString(),
        },
      });
      sessionStorage.setItem(loginKey, '1');
    }
  }, [status, session?.user?.email, pathname]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    const currentPath = pathname || '/';

    if (lastPathRef.current && lastPathRef.current !== currentPath) {
      if (!pageStartRef.current) pageStartRef.current = Date.now();
      const durationSec = Math.max(1, Math.round((Date.now() - pageStartRef.current) / 1000));
      postTrackEvent({
        activityType: 'page_time',
        source: 'activity-tracker',
        payload: {
          path: lastPathRef.current,
          durationSec,
          at: new Date().toISOString(),
        },
      });
    }

  pageStartRef.current = Date.now();
    lastPathRef.current = currentPath;

    postTrackEvent({
      activityType: 'page_view',
      source: 'activity-tracker',
      payload: {
        path: currentPath,
        at: new Date().toISOString(),
      },
    });
  }, [pathname, status, session?.user?.email]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const onBeforeUnload = () => {
      if (!lastPathRef.current) return;
      const durationSec = Math.max(1, Math.round((Date.now() - pageStartRef.current) / 1000));
      postTrackEvent(
        {
          activityType: 'page_time',
          source: 'activity-tracker',
          payload: {
            path: lastPathRef.current,
            durationSec,
            at: new Date().toISOString(),
          },
        },
        true
      );
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [status, session?.user?.email]);

  return null;
}

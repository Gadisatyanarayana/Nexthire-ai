'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

type TrackPayload = {
  activityType: string;
  source?: string;
  payload?: Record<string, unknown>;
};

const ACTIVITY_SESSION_KEY = 'nexthire:activity-session-id';
const LOGIN_SENT_PREFIX = 'nexthire:activity-login-sent:';
const LOGOUT_SENT_PREFIX = 'nexthire:activity-logout-sent:';

function getActivitySessionId() {
  if (typeof window === 'undefined') return null;

  const existing = window.sessionStorage.getItem(ACTIVITY_SESSION_KEY);
  if (existing) return existing;

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(ACTIVITY_SESSION_KEY, generated);
  return generated;
}

function loginSentKey(sessionId: string) {
  return `${LOGIN_SENT_PREFIX}${sessionId}`;
}

function logoutSentKey(sessionId: string) {
  return `${LOGOUT_SENT_PREFIX}${sessionId}`;
}

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

    const sessionId = getActivitySessionId();
    if (!sessionId) return;

    if (!sessionStorage.getItem(loginSentKey(sessionId))) {
      postTrackEvent({
        activityType: 'login',
        source: 'session-wrapper',
        payload: {
          path: pathname,
          at: new Date().toISOString(),
          sessionId,
        },
      });
      sessionStorage.setItem(loginSentKey(sessionId), '1');
    }
  }, [status, session?.user?.email, pathname]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    const currentPath = pathname || '/';
    const sessionId = getActivitySessionId();

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
          sessionId,
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
        sessionId,
      },
    });
  }, [pathname, status, session?.user?.email]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const onBeforeUnload = () => {
      const sessionId = getActivitySessionId();
      if (!lastPathRef.current || !sessionId || sessionStorage.getItem(logoutSentKey(sessionId))) return;
      const durationSec = Math.max(1, Math.round((Date.now() - pageStartRef.current) / 1000));
      postTrackEvent(
        {
          activityType: 'logout',
          source: 'activity-tracker',
          payload: {
            path: lastPathRef.current,
            at: new Date().toISOString(),
            sessionId,
          },
        },
        true
      );
      postTrackEvent(
        {
          activityType: 'page_time',
          source: 'activity-tracker',
          payload: {
            path: lastPathRef.current,
            durationSec,
            at: new Date().toISOString(),
            sessionId,
          },
        },
        true
      );
      sessionStorage.setItem(logoutSentKey(sessionId), '1');
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [status, session?.user?.email]);

  return null;
}

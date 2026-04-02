'use client';

import { signIn } from 'next-auth/react';
import { useLayoutEffect, useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [authReady, setAuthReady] = useState<boolean | null>(null);

  // Use useLayoutEffect to get theme synchronously before render
  useLayoutEffect(() => {
    const root = document.documentElement;
    const theme = localStorage.getItem('theme') || 'dark';
    const isDarkTheme = theme === 'dark';
    setIsDark(isDarkTheme);
    root.setAttribute('data-theme', theme);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      const currentTheme = root.getAttribute('data-theme') === 'dark';
      setIsDark(currentTheme);
    };
    
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    const loadHealth = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as {
          readiness?: { authReady?: boolean };
        };
        if (!active) return;
        setAuthReady(Boolean(data?.readiness?.authReady));
      } catch {
        if (!active) return;
        setAuthReady(false);
      }
    };

    void loadHealth();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignIn() {
    setIsLoading(true);
    await signIn('google', { redirect: true, callbackUrl: '/dashboard' });
    setIsLoading(false);
  }

  if (!isMounted) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md rounded-2xl border backdrop-blur-xl p-8 ${
        isDark 
          ? 'bg-white/5 border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.35)]'
          : 'bg-white border-black/10 shadow-[0_10px_30px_rgba(15,23,42,0.15)]'
      }`}>
        <div className="text-center space-y-6">
          <div>
            <h1 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              NEXTHIRE AI
            </h1>
            <p className={`text-xs uppercase tracking-[0.16em] mt-2 font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Placement-Ready Resume System
            </p>
          </div>

          <div className={`space-y-2 rounded-lg p-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>AI-Powered Resume Analysis</p>
            <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Get placement-ready with ATS scoring, role matching, and intelligent feedback
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading || authReady === false}
            className={`w-full text-lg py-4 font-bold rounded-xl transition-all duration-200 ${
              isDark
                ? 'bg-white text-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-70'
                : 'bg-black text-white hover:bg-gray-900 active:bg-gray-800 disabled:opacity-70'
            }`}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">···</span>
                Signing in...
              </>
            ) : (
              'Sign In with Google'
            )}
          </button>

          {authReady === false && (
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/55' : 'text-black/55'}`}>
              Login is temporarily unavailable because OAuth environment keys are not configured.
            </p>
          )}

          <p className={`text-xs leading-relaxed ${isDark ? 'text-white/40' : 'text-black/50'}`}>
            Secure authentication with your Google account powered by OAuth 2.0. Your data is encrypted and private.
          </p>
        </div>
      </div>
    </div>
  );
}

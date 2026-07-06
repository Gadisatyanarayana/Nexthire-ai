'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { ShieldCheck, Sparkles, Terminal, Trophy, MessageSquare, Award } from 'lucide-react';

function readInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark' || theme === 'light') return theme === 'dark';
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(readInitialTheme);
  const [authReady, setAuthReady] = useState<boolean | null>(null);

  const callbackUrlRaw = String(searchParams?.get('callbackUrl') || '/dashboard').trim();
  const authErrorCode = String(searchParams?.get('error') || '').trim();

  function resolveSafeCallbackUrl(value: string): string {
    if (!value) return '/dashboard';

    if (value.startsWith('/')) {
      return value;
    }

    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(value);
        if (parsed.origin === window.location.origin) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // Ignore malformed callback values and use dashboard fallback.
      }
    }

    return '/dashboard';
  }

  const callbackUrl = resolveSafeCallbackUrl(callbackUrlRaw);

  function getAuthErrorMessage(code: string): string | null {
    if (!code) return null;

    const map: Record<string, string> = {
      google: 'Google sign-in could not be started. Verify OAuth redirect URI is exactly http://localhost:3000/api/auth/callback/google.',
      OAuthSignin: 'Google sign-in could not be started. Please try again.',
      OAuthCallback: 'Google callback failed. Please retry sign-in.',
      OAuthCreateAccount: 'Could not create your account from Google profile.',
      EmailCreateAccount: 'Could not create your account.',
      Callback: 'Sign-in callback failed. Please retry.',
      OAuthAccountNotLinked: 'This email is already linked to another sign-in method.',
      EmailSignin: 'Email sign-in failed.',
      CredentialsSignin: 'Sign-in was rejected. Please try again.',
      SessionRequired: 'Please sign in to continue.',
      AccessDenied: 'Access denied for this account.',
      Configuration: 'Authentication configuration error. Contact support.',
      Default: 'Sign-in failed. Please try again.',
    };

    return map[code] || map.Default;
  }

  const authErrorMessage = getAuthErrorMessage(authErrorCode);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') return;

    const hostname = window.location.hostname.toLowerCase();
    const isLoopbackAlias = hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
    if (!isLoopbackAlias) return;

    const portPart = window.location.port ? `:${window.location.port}` : '';
    const target = `${window.location.protocol}//localhost${portPart}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    const loadHealth = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as { readiness?: { authReady?: boolean } };
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

  useEffect(() => {
    if (status !== 'authenticated') return;
    router.replace(callbackUrl || '/dashboard');
  }, [callbackUrl, router, status]);

  async function handleSignIn() {
    setIsLoading(true);

    try {
      const redirectTarget =
        typeof window !== 'undefined' && callbackUrl.startsWith('/')
          ? `${window.location.origin}${callbackUrl}`
          : callbackUrl || '/dashboard';

      const csrfRes = await fetch('/api/auth/csrf', { cache: 'no-store' });
      const csrfData = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
      const csrfToken = String(csrfData?.csrfToken || '').trim();

      if (!csrfToken) {
        throw new Error('Missing CSRF token');
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/signin/google';

      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = csrfToken;

      const callbackInput = document.createElement('input');
      callbackInput.type = 'hidden';
      callbackInput.name = 'callbackUrl';
      callbackInput.value = redirectTarget;

      form.appendChild(csrfInput);
      form.appendChild(callbackInput);
      document.body.appendChild(form);
      form.submit();
    } catch {
      setIsLoading(false);
      window.location.href = `/auth/signin?error=google&callbackUrl=${encodeURIComponent(callbackUrl || '/dashboard')}`;
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground premium-glow-bg">
      {/* Left panel - Branding Showcase */}
      <section className="hidden lg:flex flex-col justify-between p-12 border-r border-foreground/10 bg-foreground/2 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-xl font-bold tracking-tight">NEXTHIRE AI</span>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            PLACEMENT PERFORMANCE WORKSPACE
          </p>
        </div>

        <div className="space-y-8 relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold tracking-tight leading-tight gradient-text">
            Enterprise Training Platform for Serious Career Outcomes
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-blue-dim border border-brand-blue/30 text-brand-blue shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">AI Resume Analyzer</h4>
                <p className="text-xs text-foreground/60 leading-relaxed mt-0.5">
                  Deep ATS metrics validation and section audits aligned with actual recruiter search matrices.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-green-dim border border-brand-green/30 text-brand-green shrink-0">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Elite DSA Coding Arena</h4>
                <p className="text-xs text-foreground/60 leading-relaxed mt-0.5">
                  Write, run, and auto-evaluate coding submissions inside secure containerized sandboxes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-purple-dim border border-brand-purple/30 text-brand-purple shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Mock OA Contests</h4>
                <p className="text-xs text-foreground/60 leading-relaxed mt-0.5">
                  Compete under constraints in timed mock tests mimicking real recruiting rounds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-foreground/40 relative z-10 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-green" />
          <span>OAuth 2.0 Secure Token Verification Gateway</span>
        </div>

        {/* Glow decoration */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-blue-dim blur-3xl opacity-20 rounded-full" />
      </section>

      {/* Right panel - Form Controls */}
      <section className="flex items-center justify-center p-8">
        <div className="premium-card max-w-md w-full backdrop-blur-md bg-background/50">
          <div className="space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Access Dashboard</h1>
              <p className="text-xs text-foreground/50 leading-relaxed uppercase tracking-wider">
                Authenticate with your university registration details
              </p>
            </div>

            <div className="p-4 rounded-xl border border-foreground/10 bg-foreground/5 space-y-1.5 text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-blue">Notice</span>
              <p className="text-xs text-foreground/75 leading-relaxed">
                Sign-in utilizes OAuth. Ensure you accept profile scopes to synchronize training milestones.
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={isLoading || authReady === false}
              className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-4 text-sm font-bold text-background transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  <span>Connecting Secure Session...</span>
                </span>
              ) : (
                <span>Continue with Google</span>
              )}
            </button>

            {authReady === false && (
              <p className="text-xs leading-relaxed text-brand-red font-semibold">
                OAuth portal is offline. Workspace keys not verified.
              </p>
            )}

            {authErrorMessage && (
              <p className="text-xs leading-relaxed text-brand-red font-semibold">
                {authErrorMessage}
                {authErrorCode ? ` (code: ${authErrorCode})` : ''}
              </p>
            )}

            <div className="text-2xs text-foreground/45 border-t border-foreground/10 pt-4 leading-relaxed">
              By authenticating, you permit NextHire AI to configure your sandboxed environment and logging records.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <SignInInner />
    </Suspense>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
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

  async function handleDevSignIn() {
    setIsLoading(true);
    try {
      await signIn('credentials', { callbackUrl: callbackUrl || '/dashboard' });
    } catch {
      setIsLoading(false);
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
      <section className="flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,242,254,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative w-full max-w-md p-10 rounded-3xl border border-foreground/10 bg-background/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.2)]">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tighter">Welcome Back</h1>
              <p className="text-sm font-medium text-foreground/50 tracking-wide">
                Sign in to your NextHire workspace
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSignIn}
                disabled={isLoading || authReady === false}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-foreground px-6 py-4 text-sm font-bold text-background transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 transition-transform group-hover:scale-110">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleDevSignIn}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 px-6 py-4 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/60 active:scale-[0.98] disabled:opacity-50"
              >
                <Terminal className="h-5 w-5" />
                <span>Instant Demo / Guest Access</span>
              </button>
            </div>

            {authReady === false && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                <p className="text-sm font-semibold text-red-500">
                  Authentication server is currently unreachable.
                </p>
              </div>
            )}

            {authErrorMessage && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                <p className="text-sm font-semibold text-red-400">
                  {authErrorMessage}
                </p>
                {authErrorCode && <p className="text-xs text-red-500/70 mt-1">Error Code: {authErrorCode}</p>}
                
                {authErrorCode === 'google' && (
                  <p className="text-xs text-red-400 mt-3 font-medium text-left">
                    * Make sure you have added your GOOGLE_CLIENT_ID to the .env.local file. If you haven't, use the "Developer Bypass" button instead.
                  </p>
                )}
              </div>
            )}

            <div className="pt-6 border-t border-foreground/10 text-center">
              <p className="text-[11px] font-medium leading-relaxed text-foreground/40 uppercase tracking-widest">
                Secure Sandboxed Environment
              </p>
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

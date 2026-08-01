'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

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

  const callbackUrlRaw = String(searchParams?.get('callbackUrl') || '/').trim();
  const authErrorCode = String(searchParams?.get('error') || '').trim();

  function resolveSafeCallbackUrl(value: string): string {
    if (!value) return '/';

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
        // Ignore malformed callback values.
      }
    }

    return '/';
  }

  const callbackUrl = resolveSafeCallbackUrl(callbackUrlRaw);

  function getAuthErrorMessage(code: string): string | null {
    if (!code) return null;

    const map: Record<string, string> = {
      google: 'Google sign-in could not be started. Verify OAuth redirect URI.',
      OAuthSignin: 'Google sign-in could not be started. Please try again.',
      OAuthCallback: 'Google Callback Failed. Check that GOOGLE_CLIENT_SECRET in .env.local matches your Google Cloud secret and restart server.',
      OAuthCreateAccount: 'Could not create account from Google profile.',
      Callback: 'Sign-in callback failed. Please retry.',
      OAuthAccountNotLinked: 'This email is already linked to another sign-in method.',
      AccessDenied: 'Access denied for this account.',
      Configuration: 'Authentication configuration error. Contact support.',
      Default: 'Sign-in failed. Please try again.',
    };

    return map[code] || map.Default;
  }

  const authErrorMessage = getAuthErrorMessage(authErrorCode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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
    <main className="relative min-h-screen w-full bg-transparent text-white flex items-center justify-center overflow-hidden p-6 font-sans">
      
      {/* ── ACETERNITY UI BACKGROUND: Background Beams + Glowing Rays + Floating Particles ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Aceternity Radial Spotlight Glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 242, 254, 0.18) 0%, rgba(138, 43, 226, 0.14) 40%, rgba(3, 3, 10, 0.95) 85%)',
          }}
        />

        {/* Aceternity Animated Background Light Beams (SVG Paths) */}
        <svg className="absolute inset-0 w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="beamGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8a2be2" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#030308" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="beamGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4facfe" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00f2fe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#030308" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            d="M -100 100 Q 400 300 1200 -100"
            fill="none"
            stroke="url(#beamGradient1)"
            strokeWidth="3.5"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.path
            d="M 1400 600 Q 600 200 -200 900"
            fill="none"
            stroke="url(#beamGradient2)"
            strokeWidth="3.5"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0.4, 0.95, 0.4] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />

          <motion.path
            d="M -200 800 Q 500 100 1300 700"
            fill="none"
            stroke="url(#beamGradient1)"
            strokeWidth="2.5"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
        </svg>

        {/* Aceternity Animated Floating Particles */}
        {Array.from({ length: 35 }).map((_, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full bg-cyan-300 shadow-[0_0_14px_#00f2fe]"
            style={{
              width: `${(idx % 3) + 2}px`,
              height: `${(idx % 3) + 2}px`,
              top: `${(idx * 13) % 100}%`,
              left: `${(idx * 19) % 100}%`,
            }}
            animate={{
              y: [0, -90, 0],
              x: [0, (idx % 2 === 0 ? 35 : -35), 0],
              opacity: [0.2, 0.9, 0.2],
              scale: [0.8, 1.5, 0.8],
            }}
            transition={{
              duration: 4.5 + (idx % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: idx * 0.15,
            }}
          />
        ))}

        {/* Aceternity Grid Beams Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      {/* ── CENTERED CLEAN SIGN-IN CONTAINER (NO BLACK CARD BG) ── */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-8 sm:p-10 flex flex-col items-center text-center space-y-8"
      >
        {/* NextHire Logo Icon & NEXTHIRE AI Text */}
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/icon.svg" 
            alt="NextHire Logo" 
            className="w-20 h-20 object-contain drop-shadow-[0_0_30px_rgba(0,242,254,0.7)]"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent uppercase">
              NEXTHIRE AI
            </h1>
            <p className="text-xs font-medium text-cyan-300/80 tracking-wide">
              Placement Performance Workspace
            </p>
          </div>
        </div>

        {/* ── ONLY CONTINUE WITH GOOGLE BUTTON ── */}
        <div className="w-full pt-2">
          <button
            onClick={handleSignIn}
            disabled={isLoading || authReady === false}
            className="group relative w-full flex items-center justify-center gap-3.5 py-4 px-6 rounded-2xl bg-white text-zinc-950 font-extrabold text-sm transition-all duration-300 hover:bg-zinc-100 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Redirecting to Google...</span>
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="tracking-wide text-zinc-950">Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification Toast */}
        {authErrorMessage && (
          <div className="w-full p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-center space-y-1">
            <p className="text-xs font-bold text-red-400">
              {authErrorMessage}
            </p>
            {authErrorCode && <p className="text-[10px] text-red-500/70">Error Code: {authErrorCode}</p>}
          </div>
        )}

        {/* Security Badge Footer */}
        <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-400/70 font-semibold tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>OAuth 2.0 Encrypted Auth</span>
        </div>
      </motion.div>
    </main>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030308]" />}>
      <SignInInner />
    </Suspense>
  );
}

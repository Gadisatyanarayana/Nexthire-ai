import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { custom } from 'openid-client';
import { upsertUserAdmin } from '@/lib/supabaseAdmin';

// Increase outgoing HTTP request timeout to 30 seconds to prevent 3.5s RPError timeouts on callback
custom.setHttpOptionsDefaults({
  timeout: 30000,
});

function isLoopbackHost(hostname: string): boolean {
  const value = String(hostname || '').toLowerCase();
  return value === 'localhost' || value === '127.0.0.1' || value === '[::1]' || value === '::1';
}

function isAllowedRedirectTarget(url: string, baseUrl: string): boolean {
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);

    if (target.origin === base.origin) {
      return true;
    }

    if (
      isLoopbackHost(target.hostname) &&
      isLoopbackHost(base.hostname) &&
      target.protocol === base.protocol &&
      target.port === base.port
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

const rawGoogleSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
if (!rawGoogleSecret || rawGoogleSecret.includes('your_google_client_secret')) {
  console.error('\x1b[31m[NextAuth Error] GOOGLE_CLIENT_SECRET in .env.local is set to "your_google_client_secret_here". Google will reject token exchange with invalid_client error. Please paste your real Google Client Secret (GOCSPX-...) into line 35 of .env.local and restart server.\x1b[0m');
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'nexthire-ai-production-secret-key-32-chars-minimum-fallback',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      checks: ['state'],
      httpOptions: {
        timeout: 30000,
      },
    }),
    CredentialsProvider({
      name: 'Developer Bypass',
      credentials: {},
      async authorize() {
        return { 
          id: 'dev-user-1', 
          name: 'Satya Narayana', 
          email: 'satyanarayanag904@gmail.com',
          image: '/google-user.svg'
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        // Non-blocking fire-and-forget DB sync so network delay never blocks OAuthCallback
        upsertUserAdmin({
          name: user.name ?? null,
          email: user.email,
        }).catch((err) => {
          console.warn('Non-blocking user upsert log:', err);
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token) {
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
    async jwt({ token, user, profile }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (profile && typeof profile === 'object' && 'picture' in profile && typeof (profile as any).picture === 'string') {
        token.picture = (profile as any).picture;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (isAllowedRedirectTarget(url, baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  logger: {
    error(code, metadata) {
      if (code === "JWT_SESSION_ERROR") {
        return;
      }
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
  },
};
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { upsertUserAdmin } from '@/lib/supabaseAdmin';

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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'nexthire-ai-production-secret-key-32-chars-minimum-fallback',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
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
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (isAllowedRedirectTarget(url, baseUrl)) return url;
      return `${baseUrl}/dashboard`;
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
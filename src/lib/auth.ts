import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
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

    // Allow loopback aliases (localhost / 127.0.0.1 / ::1) on the same protocol and port in dev.
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
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        if (user.email) {
          await upsertUserAdmin({
            name: user.name ?? null,
            email: user.email,
          });
        }
      } catch (error) {
        console.error('Error in signIn callback:', error);
      }
      return true;
    },
    async session({ session }) {
      return session;
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
};
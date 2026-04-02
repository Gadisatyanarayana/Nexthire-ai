import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveUserData(user: {
  id?: string | null;
  name: string | null;
  email: string;
}) {
  try {
    if (!user.email) {
      throw new Error('Email is required to save user data');
    }
    const response = await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name, email: user.email }),
    });

    const payload = (await response.json()) as { user?: unknown; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to save user data');
    }

    return payload.user ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving user:', message);
    // Don't throw - just log the error to prevent dashboard from breaking
    return null;
  }
}

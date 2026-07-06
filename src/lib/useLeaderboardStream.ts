import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string | null;
  email: string | null;
  score: number;
  joinedAt: string | null;
  finishedAt: string | null;
  timeTakenSeconds?: number | null;
  avgMemoryKb?: number;
  avgRuntimeMs?: number;
  totalCodeChars?: number;
  timedOut?: boolean;
};

export function useLeaderboardStream(contestId: string | undefined) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;

    let cancelled = false;

    const refreshLeaderboard = async () => {
      try {
        const res = await fetch(`/api/contests/${contestId}`, { cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as { leaderboard?: LeaderboardEntry[]; error?: string };
        if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
        if (cancelled) return;
        setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to refresh leaderboard');
      }
    };

    void refreshLeaderboard();

    const participantsChannel = supabase
      .channel(`contest-leaderboard-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_participants',
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          void refreshLeaderboard();
        }
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED';
        setIsConnected(connected);
        if (!connected) {
          setError('Live updates reconnecting...');
        }
      });

    const submissionsChannel = supabase
      .channel(`contest-submissions-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          void refreshLeaderboard();
        }
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void refreshLeaderboard();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void supabase.removeChannel(participantsChannel);
      void supabase.removeChannel(submissionsChannel);
    };
  }, [contestId]);

  return { leaderboard, isConnected, error };
}

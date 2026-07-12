import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { LearningService } from "@/lib/learning/services/LearningService";
const { FeatureFlags } = LearningService;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!FeatureFlags.isLeaderboardEnabled()) {
      return NextResponse.json({ leaderboard: [] });
    }

    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from('apt_gamification_profiles')
      .select('user_id, xp_total, current_level, users!inner(name)')
      .order('xp_total', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, leaderboard: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { LearningProgressFacade } from "./ProgressFacade";
import { LearningRecommendationService } from "./LearningRecommendationService";

export class LearningDashboardService {
  private static getRawClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
  }

  public static async getDashboardOrchestration(userId: string, tenantId: string) {
    const supabase = this.getRawClient();

    // Fire all these promises in parallel to prevent N+1 and sequential blocking
    const [
      continueLearning,
      stats,
      recentActivityData
    ] = await Promise.all([
      LearningRecommendationService.getContinueLearning(userId, tenantId),
      LearningProgressFacade.getDashboardStats(userId),
      supabase
        .from('learning_events')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Parse Gamification Goal/Streak Data
    const todayProgress = {
      xp: stats?.total_xp || 0,
      dailyGoal: 500, // Hardcoded daily goal for MVP
      currentStreak: stats?.current_streak || 0,
      studyTimeMinutes: stats?.time_spent_seconds ? Math.floor(stats.time_spent_seconds / 60) : 0
    };

    return {
      continueLearning,
      todayProgress,
      recentActivity: recentActivityData.data || []
    };
  }
}

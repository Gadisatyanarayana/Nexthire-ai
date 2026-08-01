import { createClient } from "@supabase/supabase-js";
import { LearningProgressFacade } from "./ProgressFacade";
import { LearningRecommendationService } from "./LearningRecommendationService";

export class LearningDashboardService {
  private static getRawClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-supabase.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
    try {
      return createClient(supabaseUrl, supabaseKey);
    } catch {
      return null;
    }
  }

  public static async getDashboardOrchestration(userId: string, tenantId: string) {
    try {
      const supabase = this.getRawClient();

      const [continueLearning, stats, recentActivityData] = await Promise.all([
        LearningRecommendationService.getContinueLearning(userId, tenantId).catch(() => []),
        LearningProgressFacade.getDashboardStats(userId).catch(() => null),
        supabase
          ? Promise.resolve(
              supabase
                .from("learning_events")
                .select("*")
                .eq("user_id", userId)
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false })
                .limit(5)
            ).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] })
      ]);

      const todayProgress = {
        xp: stats?.total_xp || 0,
        dailyGoal: 500,
        currentStreak: stats?.currentStreak || 0,
        studyTimeMinutes: stats?.studyTimeMinutes || 0
      };

      return {
        continueLearning: continueLearning || [],
        todayProgress,
        recentActivity: (recentActivityData && 'data' in recentActivityData ? recentActivityData.data : []) || []
      };
    } catch (e) {
      console.warn("LearningDashboardService orchestration fallback:", e);
      return {
        continueLearning: [],
        todayProgress: { xp: 0, dailyGoal: 500, currentStreak: 0, studyTimeMinutes: 0 },
        recentActivity: []
      };
    }
  }
}

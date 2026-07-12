import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { FeatureFlags } from "./FeatureFlags";

export class GamificationEngine {
  public static async awardXP(userId: string, xp: number): Promise<void> {
    if (!FeatureFlags.isGamificationEnabled()) return;
    
    // In a real implementation this would fetch the profile, add XP, calculate level up,
    // update streaks, and unlock badges based on predefined thresholds.
    const { data: profile } = await supabaseAdmin
      .from('apt_gamification_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profile) {
      await supabaseAdmin
        .from('apt_gamification_profiles')
        .update({
          xp_total: profile.xp_total + xp,
          current_level: Math.floor((profile.xp_total + xp) / 1000) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabaseAdmin
        .from('apt_gamification_profiles')
        .insert({
          user_id: userId,
          xp_total: xp,
          current_level: 1,
          daily_streak: 1,
          last_active_date: new Date().toISOString().split('T')[0]
        });
    }
  }

  public static async awardBadge(userId: string, badgeId: string, badgeName: string): Promise<void> {
    if (!FeatureFlags.isGamificationEnabled()) return;
    
    await supabaseAdmin
      .from('apt_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        badge_name: badgeName
      })
      .select('*');
  }
}

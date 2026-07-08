import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabaseAdmin";

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

type Badge = {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  iconName: string;
};

const DEFAULT_BADGES: Omit<Badge, "unlockedAt">[] = [
  // Interview Milestones
  { id: "first_interview", title: "First Interview", description: "Completed your first voice interview", iconName: "Trophy" },
  { id: "interviews_5", title: "5 Interviews", description: "Completed 5 voice interviews", iconName: "Sparkles" },
  { id: "interviews_10", title: "10 Interviews", description: "Completed 10 voice interviews", iconName: "Star" },
  { id: "interviews_25", title: "25 Interviews", description: "Completed 25 voice interviews", iconName: "Award" },
  { id: "interviews_50", title: "50 Interviews", description: "Completed 50 voice interviews", iconName: "Shield" },
  { id: "interviews_100", title: "100 Interviews", description: "Completed 100 voice interviews", iconName: "Crown" },
  
  // Streak Badges
  { id: "streak_3", title: "3-Day Streak", description: "Achieved a 3-day practice streak", iconName: "Flame" },
  { id: "streak_7", title: "7-Day Streak", description: "Achieved a 7-day practice streak", iconName: "Flame" },
  { id: "streak_15", title: "15-Day Streak", description: "Achieved a 15-day practice streak", iconName: "Flame" },
  { id: "streak_30", title: "30-Day Streak", description: "Achieved a 30-day practice streak", iconName: "Flame" },
  { id: "streak_60", title: "60-Day Streak", description: "Achieved a 60-day practice streak", iconName: "Flame" },
  { id: "streak_100", title: "100-Day Streak", description: "Achieved a 100-day practice streak", iconName: "Flame" },

  // Performance Badges
  { id: "score_80", title: "Score 80+", description: "Scored 80+ overall in any interview", iconName: "ThumbsUp" },
  { id: "score_90", title: "Score 90+", description: "Scored 90+ overall in any interview", iconName: "Award" },
  { id: "perfect_score", title: "Perfect Score", description: "Achieved a score of 100 on an interview", iconName: "Star" },
  { id: "placement_ready", title: "Placement Ready", description: "Average score of 90+ across all interviews", iconName: "Briefcase" },
  { id: "top_performer", title: "Top Performer", description: "Consistently scoring high across categories", iconName: "TrendingUp" },

  // Company Badges
  { id: "company_google", title: "Google", description: "Completed a Google company interview", iconName: "Building" },
  { id: "company_amazon", title: "Amazon", description: "Completed an Amazon company interview", iconName: "Building" },
  { id: "company_microsoft", title: "Microsoft", description: "Completed a Microsoft company interview", iconName: "Building" },
  { id: "company_meta", title: "Meta", description: "Completed a Meta company interview", iconName: "Building" },
  { id: "company_apple", title: "Apple", description: "Completed an Apple company interview", iconName: "Building" },
  { id: "company_tcs", title: "TCS", description: "Completed a TCS company interview", iconName: "Building" },
  { id: "company_infosys", title: "Infosys", description: "Completed an Infosys company interview", iconName: "Building" },
  { id: "company_accenture", title: "Accenture", description: "Completed an Accenture company interview", iconName: "Building" },
  { id: "company_deloitte", title: "Deloitte", description: "Completed a Deloitte company interview", iconName: "Building" },

  // Learning Badges
  { id: "specialist_sql", title: "SQL Specialist", description: "Completed a SQL interview", iconName: "Database" },
  { id: "specialist_coding", title: "Coding Specialist", description: "Completed a Coding interview", iconName: "Code" },
  { id: "specialist_system_design", title: "System Design Specialist", description: "Completed a System Design interview", iconName: "Server" },
  { id: "hr_master", title: "HR Master", description: "Completed an interview with HR persona", iconName: "Users" },
  { id: "communication_expert", title: "Communication Expert", description: "Achieved 95+ in communication", iconName: "MessageCircle" }
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    
    // 1. Resolve user record
    const { data: userRow } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizeEmail(session.user.email))
      .maybeSingle();

    if (!userRow?.id) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const userId = userRow.id;

    // 2. Fetch history records for analytics
    const { data: historyData } = await admin
      .from("voice_interview_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const historyList = historyData || [];
    const completedCount = historyList.length;

    // 3. Fetch or initialize gamification record
    const { data: gamificationRow } = await admin
      .from("voice_interview_gamification")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let xp = 0;
    let streak = 0;
    let level = 1;
    let unlockedBadgeIds: string[] = [];

    if (gamificationRow) {
      xp = gamificationRow.total_xp || 0;
      streak = gamificationRow.current_streak || 0;
      level = gamificationRow.level || 1;
      unlockedBadgeIds = Array.isArray(gamificationRow.badges) ? gamificationRow.badges : [];
    }

    // Self-healing Badge Checks (Verify badges based on historical data)
    const activeBadgeIds = new Set<string>(unlockedBadgeIds);

    // Milestones
    if (completedCount >= 1) activeBadgeIds.add("first_interview");
    if (completedCount >= 5) activeBadgeIds.add("interviews_5");
    if (completedCount >= 10) activeBadgeIds.add("interviews_10");
    if (completedCount >= 25) activeBadgeIds.add("interviews_25");
    if (completedCount >= 50) activeBadgeIds.add("interviews_50");
    if (completedCount >= 100) activeBadgeIds.add("interviews_100");

    // Streaks
    if (streak >= 3) activeBadgeIds.add("streak_3");
    if (streak >= 7) activeBadgeIds.add("streak_7");
    if (streak >= 15) activeBadgeIds.add("streak_15");
    if (streak >= 30) activeBadgeIds.add("streak_30");
    if (streak >= 60) activeBadgeIds.add("streak_60");
    if (streak >= 100) activeBadgeIds.add("streak_100");
    
    // Check score/duration conditions
    let has80Plus = false;
    let has90Plus = false;
    let has100 = false;
    let hasCommExpert = false;
    let totalScore = 0;

     
     
      historyList.forEach((item: any) => {
      totalScore += item.overall_score || 0;
      if (item.overall_score >= 80) has80Plus = true;
      if (item.overall_score >= 90) has90Plus = true;
      if (item.overall_score === 100) has100 = true;
      
      if (item.category_scores?.communication >= 95) hasCommExpert = true;

      const comp = item.company_mode?.toLowerCase() || "";
      if (comp === "google") activeBadgeIds.add("company_google");
      if (comp === "amazon") activeBadgeIds.add("company_amazon");
      if (comp === "microsoft") activeBadgeIds.add("company_microsoft");
      if (comp === "meta") activeBadgeIds.add("company_meta");
      if (comp === "apple") activeBadgeIds.add("company_apple");
      if (comp === "tcs") activeBadgeIds.add("company_tcs");
      if (comp === "infosys") activeBadgeIds.add("company_infosys");
      if (comp === "accenture") activeBadgeIds.add("company_accenture");
      if (comp === "deloitte") activeBadgeIds.add("company_deloitte");

      const type = item.interview_type?.toLowerCase() || "";
      if (type.includes("sql")) activeBadgeIds.add("specialist_sql");
      if (type.includes("coding")) activeBadgeIds.add("specialist_coding");
      if (type.includes("system design")) activeBadgeIds.add("specialist_system_design");

      const persona = item.persona?.toLowerCase() || "";
      if (persona.includes("hr")) activeBadgeIds.add("hr_master");
    });

    if (has80Plus) activeBadgeIds.add("score_80");
    if (has90Plus) activeBadgeIds.add("score_90");
    if (has100) activeBadgeIds.add("perfect_score");
    if (hasCommExpert) activeBadgeIds.add("communication_expert");

    if (completedCount > 0 && (totalScore / completedCount) >= 90) {
      activeBadgeIds.add("placement_ready");
    }
    if (completedCount >= 5 && has90Plus && (totalScore / completedCount) >= 85) {
      activeBadgeIds.add("top_performer");
    }

    const finalBadgeIds = Array.from(activeBadgeIds);

    // Sync back to database if badges changed or no gamification row existed
    if (!gamificationRow || finalBadgeIds.length !== unlockedBadgeIds.length) {
      const newGamificationRow = {
        user_id: userId,
        total_xp: xp,
        current_streak: streak,
        level: level,
        badges: finalBadgeIds,
        updated_at: new Date().toISOString()
      };
      await admin.from("voice_interview_gamification").upsert(newGamificationRow, { onConflict: "user_id" });
      unlockedBadgeIds = finalBadgeIds;
    }

    const badges: Badge[] = DEFAULT_BADGES.map((b) => ({
      ...b,
      unlockedAt: unlockedBadgeIds.includes(b.id) ? new Date().toISOString() : null
    }));

    // 4. Calculate Analytics Snapshot
    let averageScore = 0;
    let readinessScore = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    if (completedCount > 0) {
      // Calculate overall average
       
      const totalScore = historyList.reduce((sum: number, item: any) => sum + item.overall_score, 0);
      averageScore = Math.round(totalScore / completedCount);

      // Readiness Index (average of last 3 interviews)
      const last3 = historyList.slice(-3);
       
      const sumLast3 = last3.reduce((sum: number, item: any) => sum + item.overall_score, 0);
      readinessScore = Math.round(sumLast3 / last3.length);

      // Collect strengths and suggestions from last 3 interviews
       
      last3.forEach((item: any) => {
        const itemFeedback = item.feedback || {};
        const itemStrengths = Array.isArray(itemFeedback.strengths) 
          ? itemFeedback.strengths 
          : (Array.isArray(item.category_scores?.strengths) ? item.category_scores.strengths : []);
        
        const itemSuggestions = Array.isArray(itemFeedback.aiSuggestions)
          ? itemFeedback.aiSuggestions
          : (Array.isArray(itemFeedback.suggestions) ? itemFeedback.suggestions : []);

        itemStrengths.forEach((s: string) => {
          if (s && strengths.length < 5 && !strengths.includes(s)) strengths.push(s);
        });

        itemSuggestions.forEach((w: string) => {
          if (w && weaknesses.length < 5 && !weaknesses.includes(w)) weaknesses.push(w);
        });
      });

      // Provide defaults if strengths/weaknesses are empty
      if (strengths.length === 0) {
        strengths.push("Good pacing and comfortable speaking cadence.");
        strengths.push("Demonstrated strong initial algorithm comprehension.");
      }
      if (weaknesses.length === 0) {
        weaknesses.push("Work on detailing Situation/Task context under STAR response structures.");
        weaknesses.push("Reduce usage of verbal fillers like 'um' or 'ah' by pausing.");
      }

      // Aggregate Category scores
       
     
      historyList.forEach((item: any) => {
        const catScores = item.category_scores || {};
        Object.entries(catScores).forEach(([key, val]) => {
          if (typeof val === "number") {
            categoryTotals[key] = (categoryTotals[key] || 0) + val;
            categoryCounts[key] = (categoryCounts[key] || 0) + 1;
          }
        });
      });
    } else {
      // Standard initial setup categories
      categoryTotals["self_introduction"] = 0;
      categoryCounts["self_introduction"] = 1;
      categoryTotals["code_quality"] = 0;
      categoryCounts["code_quality"] = 1;
      categoryTotals["communication"] = 0;
      categoryCounts["communication"] = 1;
      categoryTotals["filler_words"] = 0;
      categoryCounts["filler_words"] = 1;
      categoryTotals["confidence"] = 0;
      categoryCounts["confidence"] = 1;
    }

    const categoryAverages: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([key, total]) => {
      const count = categoryCounts[key] || 1;
      // Exclude generic keys that might be arrays
      if (key !== "strengths" && key !== "weaknesses") {
        categoryAverages[key] = Math.round(total / count);
      }
    });

    // Build chronological trend line (last 10 sessions)
     
    const snapshotData = historyList.slice(-10).map((item: any) => ({
      date: item.created_at,
      score: item.overall_score
    }));

    return NextResponse.json({
      xp,
      level,
      streak,
      badges,
      analytics: {
        snapshotData,
        averageScore,
        readinessScore,
        strengths,
        weaknesses,
        categoryAverages
      }
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

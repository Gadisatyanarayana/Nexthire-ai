import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");

    if (!isUuid && email) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      
      if (userRecord?.id) {
        userId = userRecord.id;
      } else {
        userId = null;
      }
    }

    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch user's topic mastery
    const { data: mastery, error: masteryErr } = await supabase
      .from("reasoning_topic_mastery")
      .select("*")
      .eq("user_id", userId);

    if (masteryErr) throw masteryErr;
    
    // Fetch recent attempts
    const { data: attempts, error: attemptsErr } = await supabase
      .from("reasoning_question_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (attemptsErr) throw attemptsErr;

    // Calculate basic stats
    const totalAttempted = attempts.length;
    const correctAttempts = attempts.filter((a: any) => a.is_correct).length;
    const accuracy = totalAttempted > 0 ? (correctAttempts / totalAttempted) * 100 : 0;

    // Advanced Student Analytics
    // 1. Learning Efficiency: Balances accuracy and time taken
    let avgTimeMs = 0;
    if (totalAttempted > 0) {
      avgTimeMs = attempts.reduce((acc: number, val: any) => acc + (val.time_taken_ms || 60000), 0) / totalAttempted;
    }
    // Assume 60s is baseline. Less time is better.
    const timeFactor = Math.min(100, Math.max(0, 100 - (avgTimeMs / 1000)));
    const learningEfficiency = Math.round((accuracy * 0.6) + (timeFactor * 0.4));

    // 2. Retention Score: Based on mastery scores
    const masteredTopics = mastery.filter((m: any) => m.mastery_score >= 80).length;
    const totalTopics = mastery.length || 1; // avoid div by 0
    const retentionScore = Math.round((masteredTopics / totalTopics) * 100);

    // Fetch company readiness
    const { data: readiness } = await supabase
      .from("apt_company_readiness")
      .select("company_id, readiness_score")
      .eq("user_id", userId)
      .limit(5);

    // 3. Placement Readiness: Average of company readiness or fallback to global mastery average
    let placementReadiness = 0;
    if (readiness && readiness.length > 0) {
      placementReadiness = Math.round(readiness.reduce((acc: number, r: any) => acc + r.readiness_score, 0) / readiness.length);
    } else {
      placementReadiness = Math.round(mastery.reduce((acc: number, m: any) => acc + m.mastery_score, 0) / totalTopics);
    }

    return NextResponse.json({
      success: true,
      data: {
        mastery,
        readiness: readiness || [],
        recentAttempts: attempts,
        stats: {
          totalAttempted,
          accuracy,
          learningEfficiency,
          retentionScore,
          placementReadiness
        },
        streak: 3 // Mock streak for dashboard testing
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

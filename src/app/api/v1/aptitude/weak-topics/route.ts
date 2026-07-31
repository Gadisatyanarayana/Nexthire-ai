import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { AnalyticsEngine } = LearningService;

const supabase = LearningQueryService.getRawClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    if (!userId && email) {
      const { data: userRecord } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
      if (userRecord?.id) userId = userRecord.id;
    }

    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    let rawMastery: any[] = [];
    let attempts: any[] = [];

    const { data: mData } = await supabase
      .from("platform_topic_mastery")
      .select("*")
      .eq("user_id", userId);
    if (mData && mData.length > 0) {
      rawMastery = mData;
    } else {
      const { data: legacyM } = await supabase
        .from("apt_topic_mastery")
        .select("*")
        .eq("user_id", userId);
      if (legacyM) rawMastery = legacyM;
    }

    const { data: attData } = await supabase
      .from("platform_user_progress")
      .select("*")
      .eq("user_id", userId);
    if (attData && attData.length > 0) {
      attempts = attData;
    } else {
      const { data: legacyAtt } = await supabase
        .from("apt_question_attempts")
        .select("*")
        .eq("user_id", userId);
      if (legacyAtt) attempts = legacyAtt;
    }

    if (rawMastery.length === 0 && attempts.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const analytics = AnalyticsEngine.computeGlobalAnalytics(attempts, rawMastery);
    
    const enrichedWeakTopics = await Promise.all(
      (analytics.weakTopics || []).map(async (wt: any) => {
        const { data: lesson } = await supabase
          .from("platform_lessons")
          .select("title, module_id")
          .eq("id", wt.topic_id)
          .maybeSingle();
        return {
          ...wt,
          lesson_title: lesson?.title || wt.topic_id,
          module_id: lesson?.module_id || "quant-arithmetic"
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedWeakTopics
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

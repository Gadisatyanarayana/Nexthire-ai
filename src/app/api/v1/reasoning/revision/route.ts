import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

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

    const now = new Date().toISOString();

    // 1. Try querying platform_topic_mastery for reasoning domain
    let revisions: any[] = [];
    const { data: masteryData } = await supabase
      .from("platform_topic_mastery")
      .select("*")
      .eq("user_id", userId)
      .lte("revision_queue_date", now)
      .order("revision_queue_date", { ascending: true });

    if (masteryData && masteryData.length > 0) {
      revisions = masteryData;
    } else {
      // Try legacy table if present
      const { data: legacyData } = await supabase
        .from("reasoning_revision_queue")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review_date", now)
        .order("next_review_date", { ascending: true });
      if (legacyData) revisions = legacyData;
    }

    // Enrich with lesson title and module_id from platform_lessons
    const enriched = await Promise.all(
      revisions.map(async (rev: any) => {
        const topicId = rev.topic_id;
        const { data: lesson } = await supabase
          .from("platform_lessons")
          .select("title, module_id")
          .eq("id", topicId)
          .maybeSingle();
        return {
          ...rev,
          apt_lessons: {
            title: lesson?.title || topicId,
            module_id: lesson?.module_id || "lr-logical-deduction"
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

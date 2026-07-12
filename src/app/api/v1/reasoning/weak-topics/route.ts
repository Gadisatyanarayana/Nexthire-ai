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
      const { data: userRecord } = await supabase.from("users").select("id").eq("email", email).single();
      if (userRecord?.id) userId = userRecord.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: mastery } = await supabase
      .from("reasoning_topic_mastery")
      .select("*, reasoning_lessons:topic_id (title, module_id)")
      .eq("user_id", userId);

    const { data: attempts } = await supabase
      .from("reasoning_question_attempts")
      .select("*")
      .eq("user_id", userId);

    const analytics = AnalyticsEngine.computeGlobalAnalytics(attempts || [], mastery || []);
    
    // For weak topics, we just return the weak topics from the analytics engine
    // attached with the lesson titles fetched via the join
    const enrichedWeakTopics = analytics.weakTopics.map((wt: any) => ({
      ...wt,
      lesson_title: wt.reasoning_lessons?.title,
      module_id: wt.reasoning_lessons?.module_id
    }));

    return NextResponse.json({
      success: true,
      data: enrichedWeakTopics
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { QuizGenerator } = LearningService;

const supabase = LearningQueryService.getRawClient();

const QuizRequestSchema = z.object({
  preference: z.object({
    focus: z.enum(["revision", "weak_topics", "company", "mixed"]),
    length: z.enum(["5", "10", "20", "50"]).optional(),
    company: z.string().optional()
  })
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = QuizRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid payload", details: (result.error as any).errors }, { status: 400 });
    }

    // Fetch user analytics for quiz generation context
    const { data: masteryRes } = await supabase.from("apt_topic_mastery").select("topic_id, mastery_score").eq("user_id", userId);

    const analyticsData = {
      mastery: masteryRes || []
    };

    const config = await QuizGenerator.generateQuizConfig(analyticsData, result.data.preference);

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

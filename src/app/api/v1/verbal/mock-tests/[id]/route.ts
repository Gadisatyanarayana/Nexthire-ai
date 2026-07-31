import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
import { getFallbackQuestionsForLesson } from "@/lib/learning/fallbackQuestions";

const supabase = LearningQueryService.getRawClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    if (!userId && email) {
      const { data: userRecord } = await supabase.from("users").select("id").eq("email", email).single();
      if (userRecord?.id) userId = userRecord.id;
    }

    let mockSession: any = null;
    if (userId) {
      const { data } = await supabase
        .from("platform_user_progress")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) mockSession = data;
    }

    let questions = getFallbackQuestionsForLesson("rc-fact-based", "verbal-ability", 20);

    if (!mockSession) {
      mockSession = {
        id,
        user_id: userId || "guest",
        session_data: {
          config: {
            id,
            title: "Verbal Ability Assessment",
            description: "Targeted Placement Mock Test",
            total_questions: questions.length,
            duration_minutes: 40
          },
          paper_ids: questions.map(q => q.id),
          status: "in_progress"
        },
        score: 0
      };
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        session: mockSession,
        questions
      } 
    });
  } catch {
    const fallbackQs = getFallbackQuestionsForLesson("rc-fact-based", "verbal-ability", 20);
    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: "session-fallback",
          session_data: {
            config: { title: "Verbal Ability Assessment", total_questions: fallbackQs.length, duration_minutes: 40 }
          }
        },
        questions: fallbackQs
      }
    });
  }
}

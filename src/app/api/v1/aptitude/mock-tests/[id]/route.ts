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

    // Try fetching session from database
    let mockSession: any = null;
    if (userId) {
      const { data } = await supabase
        .from("apt_mock_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) mockSession = data;
    }

    let questions: any[] = [];
    if (mockSession?.session_data?.paper_ids?.length) {
      const { data: dbQuestions } = await supabase
        .from("apt_questions")
        .select("*")
        .in("id", mockSession.session_data.paper_ids);
      if (dbQuestions) questions = dbQuestions;
    }

    // Fallback if session or questions not found in DB
    if (questions.length === 0) {
      questions = getFallbackQuestionsForLesson("percentages", "quantitative-aptitude", 20);
    }

    if (!mockSession) {
      mockSession = {
        id,
        user_id: userId || "guest",
        session_data: {
          config: {
            id,
            title: "Aptitude Assessment",
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
    const fallbackQs = getFallbackQuestionsForLesson("percentages", "quantitative-aptitude", 20);
    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: "session-fallback",
          session_data: {
            config: { title: "Aptitude Assessment", total_questions: fallbackQs.length, duration_minutes: 40 }
          }
        },
        questions: fallbackQs
      }
    });
  }
}

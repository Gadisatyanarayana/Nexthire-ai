import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { MockAnalyticsEngine } = LearningService;

const supabase = LearningQueryService.getRawClient();

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

    const { session_id, submissions } = await request.json();

    if (!session_id || !submissions) {
      return NextResponse.json({ success: false, error: "Missing session_id or submissions" }, { status: 400 });
    }

    // 1. Fetch existing session to get paper_ids
    const { data: mockSession, error: fetchError } = await supabase
      .from("reasoning_mock_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !mockSession) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const paperIds = mockSession.session_data?.paper_ids || [];

    // 2. Fetch the actual questions to verify answers
    const { data: questions, error: qError } = await supabase
      .from("reasoning_questions")
      .select("id, correct_index, difficulty, lesson_id")
      .in("id", paperIds);

    if (qError || !questions) {
      return NextResponse.json({ success: false, error: "Failed to fetch question data" }, { status: 500 });
    }

    const qMap = new Map(questions.map(q => [q.id, q]));

    // 3. Re-evaluate submissions strictly on the backend
    const evaluatedSubmissions = submissions.map((sub: any) => {
      const dbQ = qMap.get(sub.question_id);
      return {
        question_id: sub.question_id,
        selected_option: sub.selected_option,
        time_taken_ms: sub.time_taken_ms || 0,
        is_correct: dbQ ? dbQ.correct_index === sub.selected_option : false,
        difficulty: dbQ ? dbQ.difficulty : "medium",
        topic_id: dbQ ? dbQ.lesson_id : "unknown"
      };
    });

    // 4. Process Analytics
    const analytics = MockAnalyticsEngine.computeAnalytics(evaluatedSubmissions);

    // 5. Update Session
    const sessionData = {
      ...mockSession.session_data,
      submissions: evaluatedSubmissions,
      analytics,
      status: "completed"
    };

    const { error: updateError } = await supabase
      .from("reasoning_mock_sessions")
      .update({
        end_time: new Date().toISOString(),
        score: analytics.overall_score,
        session_data: sessionData
      })
      .eq("id", session_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: { analytics } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

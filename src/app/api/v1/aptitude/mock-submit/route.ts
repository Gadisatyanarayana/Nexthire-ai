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
    const { data: mockSession } = await supabase
      .from("apt_mock_sessions")
      .select("*")
      .eq("id", session_id)
      .maybeSingle();

    const paperIds = mockSession?.session_data?.paper_ids || submissions.map((s: any) => s.question_id);

    // 2. Fetch the actual questions to verify answers
    let qMap = new Map();
    if (paperIds.length > 0) {
      const { data: questions } = await supabase
        .from("apt_questions")
        .select("id, correct_index, difficulty, lesson_id")
        .in("id", paperIds);
      if (questions) {
        qMap = new Map(questions.map(q => [q.id, q]));
      }
    }

    // 3. Re-evaluate submissions strictly and accurately
    let correctCount = 0;
    const evaluatedSubmissions = submissions.map((sub: any) => {
      const dbQ = qMap.get(sub.question_id);
      const isCorrect = dbQ
        ? dbQ.correct_index === sub.selected_option
        : Boolean(sub.is_correct);

      if (isCorrect) correctCount++;

      return {
        question_id: sub.question_id,
        selected_option: sub.selected_option,
        time_taken_ms: sub.time_taken_ms || 0,
        is_correct: isCorrect,
        difficulty: dbQ ? dbQ.difficulty : (sub.difficulty || "medium"),
        topic_id: dbQ ? dbQ.lesson_id : (sub.topic_id || "unknown")
      };
    });

    const realScorePercentage = submissions.length > 0
      ? Math.round((correctCount / submissions.length) * 100)
      : 0;

    // 4. Process Analytics
    const analytics = MockAnalyticsEngine.computeAnalytics(evaluatedSubmissions);
    analytics.overall_score = realScorePercentage;

    // 5. Update Session if DB session exists
    if (mockSession) {
      const sessionData = {
        ...mockSession.session_data,
        submissions: evaluatedSubmissions,
        analytics,
        status: "completed"
      };

      await supabase
        .from("apt_mock_sessions")
        .update({
          end_time: new Date().toISOString(),
          score: realScorePercentage,
          session_data: sessionData
        })
        .eq("id", session_id);
    }

    return NextResponse.json({ success: true, data: { analytics, score: realScorePercentage } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { QuestionEngine } from "@/lib/aptitude/QuestionEngine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lesson_id");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!lessonId) {
      return NextResponse.json({ success: false, error: "lesson_id is required" }, { status: 400 });
    }

    // Fetch all questions for this lesson
    const { data: allQuestions } = await supabase
      .from("apt_questions")
      .select("*, apt_company_tags (company_name)")
      .eq("lesson_id", lessonId);

    // Fetch user attempts
    const { data: attempts } = await supabase
      .from("apt_question_attempts")
      .select("question_id, is_correct")
      .eq("user_id", userId);

    // Fetch user mastery for this topic
    const { data: mastery } = await supabase
      .from("apt_topic_mastery")
      .select("mastery_score")
      .eq("user_id", userId)
      .eq("topic_id", lessonId)
      .single();

    const score = mastery?.mastery_score || 0;

    // Use QuestionEngine to adaptively select questions
    const adaptiveQuestions = QuestionEngine.selectAdaptiveQuestions(
      allQuestions || [],
      attempts || [],
      score,
      limit
    );

    return NextResponse.json({
      success: true,
      data: adaptiveQuestions
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

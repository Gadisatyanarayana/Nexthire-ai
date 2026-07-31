import { NextRequest, NextResponse } from "next/server";
import { getFallbackQuestionsForLesson } from "@/lib/learning/fallbackQuestions";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get("lesson_id") || "rc-fact-based";
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const supabase = LearningQueryService.getRawClient();

    const fetchDbQuestions = async () => {
      const { data, error } = await supabase
        .from("verbal_questions")
        .select("*")
        .eq("topic_id", lessonId)
        .limit(limit);
      if (error || !data || data.length === 0) return null;
      return data;
    };

    // Fast 300ms race timeout
    const dbData = await Promise.race([
      fetchDbQuestions(),
      new Promise<null>((r) => setTimeout(() => r(null), 300))
    ]).catch(() => null);

    if (dbData && dbData.length > 0) {
      return NextResponse.json({ success: true, data: dbData });
    }

    // Fallback to rich local verbal questions
    const fallback = getFallbackQuestionsForLesson(lessonId, "verbal", limit);
    return NextResponse.json({ success: true, data: fallback });
  } catch (error: any) {
    const fallback = getFallbackQuestionsForLesson("rc-fact-based", "verbal", 15);
    return NextResponse.json({ success: true, data: fallback });
  }
}

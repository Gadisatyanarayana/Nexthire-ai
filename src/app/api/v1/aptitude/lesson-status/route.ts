import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

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

    if (!lessonId) {
      return NextResponse.json({ success: false, error: "lesson_id is required" }, { status: 400 });
    }

    // Get total questions available for this lesson
    let totalAvailable = 0;
    const { count: exactCount } = await supabase.from("apt_questions").select("*", { count: 'exact', head: true }).eq("lesson_id", lessonId);
    if (exactCount && exactCount > 0) {
      totalAvailable = exactCount;
    } else {
      // Fallback to module
      const { data: lesson } = await supabase.from("apt_lessons").select("module_id").eq("id", lessonId).single();
      if (lesson?.module_id) {
        const { data: moduleLessons } = await supabase.from("apt_lessons").select("id").eq("module_id", lesson.module_id);
        const moduleLessonIds = moduleLessons?.map(l => l.id) || [];
        if (moduleLessonIds.length > 0) {
          const { count: modCount } = await supabase.from("apt_questions").select("*", { count: 'exact', head: true }).in("lesson_id", moduleLessonIds);
          if (modCount) totalAvailable = modCount;
        }
      }
      if (totalAvailable === 0) totalAvailable = 100; // Global fallback
    }

    // Get user attempts for this lesson topic
    const { data: attempts } = await supabase.from("apt_question_attempts").select("is_correct").eq("user_id", userId).eq("topic_id", lessonId);
    
    const practiceAttempted = attempts?.length || 0;
    const practiceCorrect = attempts?.filter(a => a.is_correct).length || 0;
    
    // Check mastery status
    const { data: mastery } = await supabase.from("apt_topic_mastery").select("mastery_score").eq("user_id", userId).eq("topic_id", lessonId).single();
    const hasMastery = (mastery?.mastery_score || 0) > 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAvailable,
        practiceAttempted,
        practiceCorrect,
        hasMastery
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

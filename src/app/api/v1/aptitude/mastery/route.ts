import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { LearningService } from "@/lib/learning/services/LearningService";
const { KnowledgeGraphEngine, SmartRevisionEngine } = LearningService;

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

    const { data: mastery, error } = await supabase
      .from("apt_topic_mastery")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mastery || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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

    const { topicId, markAsComplete } = await request.json();

    if (!topicId || !markAsComplete) {
      return NextResponse.json({ success: false, error: "Missing topicId" }, { status: 400 });
    }

    // Verify minimum practice completed (e.g., 5 questions attempted with >= 60% accuracy)
    const { data: attempts, error: attemptsError } = await supabase
      .from("apt_question_attempts")
      .select(`
        is_correct,
        apt_questions!inner(lesson_id)
      `)
      .eq("user_id", userId)
      .eq("apt_questions.lesson_id", topicId);

    if (attemptsError) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 500 });
    }

    const totalAttempts = attempts?.length || 0;
    const correctAttempts = attempts?.filter(a => a.is_correct).length || 0;
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    if (totalAttempts < 5 || accuracy < 60) {
      return NextResponse.json({ 
        success: false, 
        error: "Lesson incomplete. You must attempt at least 5 practice questions and achieve 60% accuracy." 
      }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("apt_topic_mastery")
      .select("mastery_score, questions_attempted")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .single();

    // Give a computed score based on accuracy (min 60 if they passed the barrier)
    const computedScore = Math.max(existing?.mastery_score || 0, Math.max(60, accuracy));
    const mastery_level = KnowledgeGraphEngine.getMasteryLevel(computedScore);

    await supabase.from("apt_topic_mastery").upsert({
      user_id: userId,
      topic_id: topicId,
      mastery_score: computedScore,
      mastery_level: mastery_level,
      questions_attempted: totalAttempts,
      last_reviewed_at: new Date().toISOString()
    }, { onConflict: "user_id,topic_id" });

    // Push to revision queue to schedule next review
    const { data: currentQueue } = await supabase
      .from("apt_revision_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .single();

    
    // Attempting to calculate confidence based on payload or defaulting to a mid-range.
    const confidenceScore = (request as any).confidenceScore || 3;
    const wrongAttempts = (request as any).wrongAttempts || 0;

    const revisionParams = SmartRevisionEngine.calculateNextReview(
      currentQueue?.interval_days || 0,
      currentQueue?.ease_factor || 2.5,
      computedScore,
      confidenceScore,
      wrongAttempts
    );

    await supabase.from("apt_revision_queue").upsert({
      user_id: userId,
      topic_id: topicId,
      next_review_date: revisionParams.nextReviewDate,
      interval_days: revisionParams.newInterval,
      ease_factor: revisionParams.newEase
    }, { onConflict: "user_id,topic_id" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

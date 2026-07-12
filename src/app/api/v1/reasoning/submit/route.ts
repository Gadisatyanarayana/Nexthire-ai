import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { AdaptiveLearningEngine, SpacedRepetitionEngine } = LearningService;

const supabase = LearningQueryService.getRawClient();

const SubmitAttemptSchema = z.object({
  question_id: z.string(),
  is_correct: z.boolean(),
  time_taken_ms: z.number(),
  topic_id: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  hint_used: z.boolean().default(false),
  confidence_score: z.number().min(1).max(5).default(3) // 1-5 rating mapping to SM-2 quality (0-5 internally, we map 1-5 straight or with an offset)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");

    if (!isUuid && email) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      if (userRecord?.id) userId = userRecord.id;
      else userId = null;
    }

    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SubmitAttemptSchema.parse(body);

    // 1. Record attempt
    const { error: attemptErr } = await supabase
      .from("reasoning_question_attempts")
      .insert({
        user_id: userId,
        question_id: parsed.question_id,
        is_correct: parsed.is_correct,
        time_taken_ms: parsed.time_taken_ms
      });
      
    if (attemptErr) throw attemptErr;

    // 2. Adaptive Learning & SM-2 Mastery Updates
    if (parsed.topic_id) {
      // Fetch current mastery
      const { data: currentMastery } = await supabase
        .from("reasoning_topic_mastery")
        .select("mastery_score, questions_attempted")
        .eq("user_id", userId)
        .eq("topic_id", parsed.topic_id)
        .single();
        
      const currentScore = currentMastery?.mastery_score || 0;
      const currentAttempts = currentMastery?.questions_attempted || 0;
      
      const newMasteryScore = AdaptiveLearningEngine.calculateNewMastery({
        isCorrect: parsed.is_correct,
        difficulty: parsed.difficulty,
        timeTakenMs: parsed.time_taken_ms,
        hintUsed: parsed.hint_used,
        confidenceScore: parsed.confidence_score,
        currentMasteryScore: currentScore,
        totalAttempts: currentAttempts
      });

      await supabase
        .from("reasoning_topic_mastery")
        .upsert({
          user_id: userId,
          topic_id: parsed.topic_id,
          mastery_score: newMasteryScore,
          questions_attempted: currentAttempts + 1,
          last_reviewed_at: new Date().toISOString()
        }, { onConflict: "user_id,topic_id" });

      // Fetch current revision queue state
      const { data: currentRevision } = await supabase
        .from("reasoning_revision_queue")
        .select("interval, ease_factor, review_count, next_review_date")
        .eq("user_id", userId)
        .eq("topic_id", parsed.topic_id)
        .single();

      // SM-2 quality score map (1-5 user input maps directly to 1-5 SM-2, 0 implies blackout which we map to incorrect)
      const sm2Quality = parsed.is_correct ? parsed.confidence_score : Math.max(0, parsed.confidence_score - 3);

      const sm2Result = SpacedRepetitionEngine.calculateNextReview(sm2Quality, {
        repetitions: currentRevision?.review_count || 0,
        interval: currentRevision?.interval || 0,
        easeFactor: currentRevision?.ease_factor || 2.5
      });

      await supabase
        .from("reasoning_revision_queue")
        .upsert({
          user_id: userId,
          topic_id: parsed.topic_id,
          next_review_date: sm2Result.nextReviewDate,
          interval: sm2Result.interval,
          ease_factor: sm2Result.easeFactor,
          review_count: sm2Result.repetitions,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,topic_id" });
    }

    return NextResponse.json({
      success: true,
      data: { recorded: true }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


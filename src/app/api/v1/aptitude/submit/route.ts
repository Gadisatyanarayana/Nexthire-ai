import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SubmitAttemptSchema = z.object({
  question_id: z.string(),
  is_correct: z.boolean(),
  time_taken_ms: z.number(),
  topic_id: z.string().optional(),
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
      
      if (userRecord?.id) {
        userId = userRecord.id;
      } else {
        userId = null;
      }
    }

    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SubmitAttemptSchema.parse(body);

    // 1. Record attempt
    const { error: attemptErr } = await supabase
      .from("apt_question_attempts")
      .insert({
        user_id: userId,
        question_id: parsed.question_id,
        is_correct: parsed.is_correct,
        time_taken_ms: parsed.time_taken_ms
      });
      
    if (attemptErr) throw attemptErr;

    // 2. Update topic mastery
    if (parsed.topic_id) {
      const { data: currentMastery } = await supabase
        .from("apt_topic_mastery")
        .select("mastery_score, questions_attempted")
        .eq("user_id", userId)
        .eq("topic_id", parsed.topic_id)
        .single();
        
      let newScore = parsed.is_correct ? 5 : 0;
      let newAttempted = 1;
      
      if (currentMastery) {
        newAttempted = currentMastery.questions_attempted + 1;
        newScore = (currentMastery.mastery_score * currentMastery.questions_attempted + (parsed.is_correct ? 100 : 0)) / newAttempted;
      }
      
      await supabase
        .from("apt_topic_mastery")
        .upsert({
          user_id: userId,
          topic_id: parsed.topic_id,
          mastery_score: newScore,
          questions_attempted: newAttempted,
          last_reviewed_at: new Date().toISOString()
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { LearningService } from "@/lib/learning/services/LearningService";
const { AIReviewEngine } = LearningService;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ReviewRequestSchema = z.object({
  sessionId: z.string().uuid()
});

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

    const body = await request.json();
    const result = ReviewRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid payload", details: (result.error as any).errors }, { status: 400 });
    }

    // Fetch the session data
    const { data: mockSession } = await supabase
      .from("apt_mock_sessions")
      .select("session_data, score")
      .eq("id", result.data.sessionId)
      .eq("user_id", userId)
      .single();

    if (!mockSession) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const review = await AIReviewEngine.generateSessionReview(mockSession);

    // Persist the review into the session data so we don't regenerate it
    await supabase
      .from("apt_mock_sessions")
      .update({
        session_data: { ...mockSession.session_data, ai_review: review }
      })
      .eq("id", result.data.sessionId);

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

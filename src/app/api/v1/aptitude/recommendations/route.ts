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

    // A recommendation engine might combine:
    // 1. Due Revisions
    // 2. Weak Topics
    // 3. New Lessons (lessons without mastery)

    // We'll construct a Today's Learning Plan
    const now = new Date().toISOString();
    
    // 1. Revisions
    const { data: revisions } = await supabase
      .from("apt_revision_queue")
      .select("topic_id, next_review_date, apt_lessons:topic_id (title, module_id)")
      .eq("user_id", userId)
      .lte("next_review_date", now)
      .limit(3);

    // 2. Weak Topics
    const { data: weak } = await supabase
      .from("apt_topic_mastery")
      .select("topic_id, mastery_score, apt_lessons:topic_id (title, module_id)")
      .eq("user_id", userId)
      .lt("mastery_score", 50)
      .order("mastery_score", { ascending: true })
      .limit(3);

    return NextResponse.json({
      success: true,
      data: {
        due_revisions: revisions || [],
        weak_topics: weak || []
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

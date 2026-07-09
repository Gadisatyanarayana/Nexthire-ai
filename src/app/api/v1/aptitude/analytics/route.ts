import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
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
    
    // Fetch user's topic mastery
    const { data: mastery, error: masteryErr } = await supabase
      .from("apt_topic_mastery")
      .select("*")
      .eq("user_id", userId);

    if (masteryErr) throw masteryErr;
    
    // Fetch recent attempts
    const { data: attempts, error: attemptsErr } = await supabase
      .from("apt_question_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (attemptsErr) throw attemptsErr;

    // Calculate basic stats
    const totalAttempted = attempts.length;
    const correctAttempts = attempts.filter((a: any) => a.is_correct).length;
    const accuracy = totalAttempted > 0 ? (correctAttempts / totalAttempted) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        mastery,
        recentAttempts: attempts,
        stats: {
          totalAttempted,
          accuracy
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

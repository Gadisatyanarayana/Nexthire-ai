import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WeakTopicCoach } from "@/lib/aptitude/WeakTopicCoach";
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

    // Fetch user analytics for coaching
    const [masteryRes, mocksRes] = await Promise.all([
      supabase.from("apt_topic_mastery").select("topic_id, mastery_score").eq("user_id", userId),
      supabase.from("apt_mock_sessions").select("score, end_time").eq("user_id", userId).not("end_time", "is", null).order("end_time", { ascending: false }).limit(3)
    ]);

    const analyticsData = {
      mastery: masteryRes.data || [],
      recentMocks: mocksRes.data || []
    };

    const plan = await WeakTopicCoach.generateStudyPlan(analyticsData);

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

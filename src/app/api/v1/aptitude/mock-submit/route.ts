import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { MockAnalyticsEngine } from "@/lib/aptitude/MockAnalyticsEngine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { session_id, submissions } = await request.json();

    if (!session_id || !submissions) {
      return NextResponse.json({ success: false, error: "Missing session_id or submissions" }, { status: 400 });
    }

    // Process Analytics
    const analytics = MockAnalyticsEngine.computeAnalytics(submissions);

    // Fetch existing session
    const { data: mockSession, error: fetchError } = await supabase
      .from("apt_mock_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !mockSession) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    // Update Session
    const sessionData = {
      ...mockSession.session_data,
      submissions,
      analytics,
      status: "completed"
    };

    const { error: updateError } = await supabase
      .from("apt_mock_sessions")
      .update({
        end_time: new Date().toISOString(),
        score: analytics.overall_score,
        session_data: sessionData
      })
      .eq("id", session_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: { analytics } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

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

    const { data: history, error } = await supabase
      .from("reasoning_mock_sessions")
      .select("id, start_time, end_time, score, session_data->config")
      .eq("user_id", userId)
      .not("end_time", "is", null) // only completed
      .order("end_time", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: history || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

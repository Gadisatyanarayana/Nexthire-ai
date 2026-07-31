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
      const { data: userRecord } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
      if (userRecord?.id) userId = userRecord.id;
    }

    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: history } = await supabase
      .from("reasoning_mock_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, data: history || [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

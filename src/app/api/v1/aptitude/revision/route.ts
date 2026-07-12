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

    // Get due revisions (next_review_date <= now)
    const now = new Date().toISOString();
    const { data: revisions, error } = await supabase
      .from("apt_revision_queue")
      .select(`
        *,
        apt_lessons:topic_id (id, title, module_id)
      `)
      .eq("user_id", userId)
      .lte("next_review_date", now)
      .order("next_review_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: revisions || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const { data: mockSession, error } = await supabase
      .from("apt_mock_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !mockSession) {
      return NextResponse.json({ success: false, error: "Mock session not found" }, { status: 404 });
    }

    const paperIds = mockSession.session_data?.paper_ids || [];
    
    // Fetch the actual questions
    const { data: questions } = await supabase
      .from("apt_questions")
      .select("*")
      .in("id", paperIds);

    return NextResponse.json({ 
      success: true, 
      data: {
        session: mockSession,
        questions: questions || []
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

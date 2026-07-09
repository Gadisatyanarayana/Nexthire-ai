import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { CompanyEngine } from "@/lib/aptitude/CompanyEngine";
import { MockTestEngine } from "@/lib/aptitude/MockTestEngine";

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

    const body = await request.json();
    const { company_id } = body;

    let config;
    if (company_id) {
      const company = CompanyEngine.getCompany(company_id);
      if (!company) {
        return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
      }
      config = MockTestEngine.generateCompanyMockConfig(company);
    } else {
      // Fallback custom mock
      config = {
        id: `mock-custom-${Date.now()}`,
        title: `Custom Full Length Mock`,
        description: `General Assessment`,
        type: "full-length",
        duration_minutes: 60,
        total_questions: 30,
        passing_score: 60
      };
    }

    // Fetch all available questions (in production you would paginate/stream, but for mock generation we can fetch a pool)
    const { data: allQuestions } = await supabase
      .from("apt_questions")
      .select("*")
      .limit(500);

    const paper = MockTestEngine.buildTestPaper(config as any, allQuestions || []);

    // Create session in database
    const sessionData = {
      config,
      paper_ids: paper.map(q => q.id),
      status: "in_progress"
    };

    const { data: mockSession, error } = await supabase
      .from("apt_mock_sessions")
      .insert({
        user_id: userId,
        session_data: sessionData,
        score: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { session_id: mockSession.id, paper } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

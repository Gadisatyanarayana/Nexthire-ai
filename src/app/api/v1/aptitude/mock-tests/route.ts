import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { MockTestEngine } = LearningService;

const supabase = LearningQueryService.getRawClient();

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
    const { company_id, custom_config } = body;

    let config;
    if (custom_config) {
      config = {
        id: `mock-custom-${Date.now()}`,
        title: `AI Custom Quiz`,
        description: `Targeting ${custom_config.topics?.join(", ") || "weak areas"}`,
        type: "custom",
        duration_minutes: custom_config.numQuestions * 2,
        total_questions: custom_config.numQuestions,
        passing_score: 60,
        ...custom_config
      };
    } else if (company_id) {
      const { data: company } = await supabase.from("apt_companies").select("*").ilike("id", company_id).single();
      if (!company) {
        return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
      }
      config = MockTestEngine.generateCompanyMockConfig(company as any);
      
      // Fetch question IDs tagged for this company
      const { data: tags } = await supabase.from("apt_company_tags").select("question_id").ilike("company_name", company.name);
      if (tags && tags.length > 0) {
        const qIds = tags.map(t => t.question_id);
        const { data: companyQuestions } = await supabase.from("apt_questions").select("*").in("id", qIds).limit(500);
        
        let paper = MockTestEngine.buildTestPaper(config as any, companyQuestions || []);
        
        // If not enough questions tagged, fallback to generic
        if (paper.length < config.total_questions) {
          const { data: allQuestions } = await supabase.from("apt_questions").select("*").limit(500);
          paper = MockTestEngine.buildTestPaper(config as any, allQuestions || []);
        }
        
        const sessionData = { config, paper_ids: paper.map((q: any) => q.id), status: "in_progress" };
        const { data: mockSession, error } = await supabase.from("apt_mock_sessions").insert({ user_id: userId, session_data: sessionData, score: 0 }).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data: { session_id: mockSession.id, paper } });
      }
    } else {
      // Fallback custom mock
      config = {
        id: `mock-general-${Date.now()}`,
        title: `General Assessment`,
        description: `Full Length Mock`,
        type: "full-length",
        duration_minutes: 60,
        total_questions: 30,
        passing_score: 60
      };
    }

    // Fetch questions targeting specific topics if requested
    let query = supabase.from("apt_questions").select("*");
    const targetTopics = config.topics || config.topic_ids || [];
    if (targetTopics.length > 0) {
      query = query.in("lesson_id", targetTopics);
    }
    const { data: allQuestions } = await query.limit(1000);

    let paper = MockTestEngine.buildTestPaper(config as any, allQuestions || []);
    
    if (paper.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to generate paper. No questions available for selection." }, { status: 400 });
    }

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

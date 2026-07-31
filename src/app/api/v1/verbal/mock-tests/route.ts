import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
import { getFallbackQuestionsForLesson } from "@/lib/learning/fallbackQuestions";
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

    let config: any;
    if (custom_config) {
      const totalQ = custom_config.numQuestions || 20;
      config = {
        id: `mock-custom-${Date.now()}`,
        title: `AI Custom Verbal Quiz`,
        description: `Targeting ${custom_config.topics?.join(", ") || "weak areas"}`,
        type: "custom",
        duration_minutes: totalQ * 2,
        total_questions: totalQ,
        passing_score: 60,
        ...custom_config
      };
    } else if (company_id) {
      config = {
        id: `mock-company-${company_id}-${Date.now()}`,
        title: `${company_id.toUpperCase()} Verbal Assessment`,
        description: `Official pattern questions`,
        type: "company",
        duration_minutes: 40,
        total_questions: 20,
        passing_score: 60
      };
    } else {
      config = {
        id: `mock-general-${Date.now()}`,
        title: `Verbal Ability Assessment`,
        description: `Full Length Mock`,
        type: "full-length",
        duration_minutes: 45,
        total_questions: 20,
        passing_score: 60
      };
    }

    let questionsPool: any[] = [];
    const targetTopics = config.topics || config.topic_ids || [];
    if (targetTopics.length > 0) {
      const { data: topicQs } = await supabase.from("platform_questions").select("*").in("lesson_id", targetTopics).limit(1000);
      if (topicQs) questionsPool.push(...topicQs);
    }

    if (questionsPool.length < config.total_questions) {
      const extraNeeded = config.total_questions - questionsPool.length + 10;
      const fallbackQs = getFallbackQuestionsForLesson("rc-fact-based", "verbal-ability", extraNeeded);
      const existingIds = new Set(questionsPool.map(q => q.id));
      fallbackQs.forEach((q: any) => {
        if (!existingIds.has(q.id)) questionsPool.push(q);
      });
    }

    let paper = MockTestEngine.buildTestPaper(config as any, questionsPool);
    
    if (paper.length < config.total_questions) {
      const fallbackQs = getFallbackQuestionsForLesson("rc-fact-based", "verbal-ability", config.total_questions);
      paper = fallbackQs.slice(0, config.total_questions);
    }

    const sessionData = {
      config,
      paper_ids: paper.map((q: any) => q.id),
      status: "in_progress"
    };

    let sessionId = `session-${Date.now()}`;
    return NextResponse.json({ success: true, data: { session_id: sessionId, paper } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

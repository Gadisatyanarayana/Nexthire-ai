import { NextRequest, NextResponse } from "next/server";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { CompanyEngine } = LearningService;

const supabase = LearningQueryService.getRawClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    // 1. Fetch real company data from reasoning_companies table
    const { data: company, error: companyError } = await supabase
      .from("reasoning_companies")
      .select("*")
      .ilike("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: "Company not found in reasoning_companies" }, { status: 404 });
    }

    // 2. Fetch all tags for this company to dynamically compute topic weightage
    const { data: tags, error: tagsError } = await supabase
      .from("reasoning_company_tags")
      .select("question_id, reasoning_questions(lesson_id)")
      .ilike("company_name", company.name);

    let topic_weightage: Record<string, { weight: number, lessonId: string, moduleId: string }> = {};
    
    if (tags && !tagsError) {
      const counts: Record<string, number> = {};
      let total = 0;
      
      // Resolve lesson IDs to topics
      const lessonIds = [...new Set(tags.map(t => (t.reasoning_questions as any)?.lesson_id).filter(Boolean))];
      const { data: lessons } = await supabase.from("reasoning_lessons").select("id, title, module_id").in("id", lessonIds);
      const lessonMap = new Map((lessons || []).map(l => [l.id, l]));

      for (const tag of tags) {
        const lId = (tag.reasoning_questions as any)?.lesson_id;
        if (lId) {
          counts[lId] = (counts[lId] || 0) + 1;
          total++;
        }
      }

      if (total > 0) {
        for (const [lId, count] of Object.entries(counts)) {
          const lessonObj = lessonMap.get(lId);
          if (lessonObj) {
            topic_weightage[lessonObj.title] = {
              weight: Math.round((count / total) * 100),
              lessonId: lessonObj.id,
              moduleId: lessonObj.module_id
            };
          }
        }
      }
    }

    // Assign dynamically calculated weightage
    company.topic_weightage = Object.keys(topic_weightage).length > 0 ? topic_weightage : company.topic_weightage;

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

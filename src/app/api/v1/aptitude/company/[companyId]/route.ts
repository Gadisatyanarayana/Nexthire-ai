import { NextRequest, NextResponse } from "next/server";
import { CompanyEngine } from "@/lib/aptitude/CompanyEngine";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    // 1. Fetch real company data from apt_companies table
    const { data: company, error: companyError } = await supabase
      .from("apt_companies")
      .select("*")
      .ilike("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: "Company not found in apt_companies" }, { status: 404 });
    }

    // 2. Fetch all tags for this company to dynamically compute topic weightage
    const { data: tags, error: tagsError } = await supabase
      .from("apt_company_tags")
      .select("question_id, apt_questions(lesson_id)")
      .ilike("company_name", company.name);

    let topic_weightage: Record<string, { weight: number, lessonId: string, moduleId: string }> = {};
    
    if (tags && !tagsError) {
      const counts: Record<string, number> = {};
      let total = 0;
      
      // Resolve lesson IDs to topics
      const lessonIds = [...new Set(tags.map(t => (t.apt_questions as any)?.lesson_id).filter(Boolean))];
      const { data: lessons } = await supabase.from("apt_lessons").select("id, title, module_id").in("id", lessonIds);
      const lessonMap = new Map((lessons || []).map(l => [l.id, l]));

      for (const tag of tags) {
        const lId = (tag.apt_questions as any)?.lesson_id;
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

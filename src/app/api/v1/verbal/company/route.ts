import { NextResponse } from "next/server";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

const DEFAULT_COMPANIES = [
  { id: "tcs", name: "TCS (Tata Consultancy Services)", logo_url: "https://logo.clearbit.com/tcs.com", active: true, sections: ["Verbal Ability", "Reading Comprehension", "Grammar & Usage"], question_count: 120 },
  { id: "infosys", name: "Infosys", logo_url: "https://logo.clearbit.com/infosys.com", active: true, sections: ["Verbal Ability", "Critical Reasoning", "Sentence Correction"], question_count: 105 },
  { id: "wipro", name: "Wipro NLTH", logo_url: "https://logo.clearbit.com/wipro.com", active: true, sections: ["English Verbal", "Vocabulary & Synonyms", "Error Spotting"], question_count: 90 },
  { id: "accenture", name: "Accenture", logo_url: "https://logo.clearbit.com/accenture.com", active: true, sections: ["English Ability", "Reading Passages", "Para Jumbles"], question_count: 95 },
  { id: "cognizant", name: "Cognizant (GenC)", logo_url: "https://logo.clearbit.com/cognizant.com", active: true, sections: ["Verbal Communication", "Grammar & Sentence Completion"], question_count: 85 },
  { id: "deloitte", name: "Deloitte", logo_url: "https://logo.clearbit.com/deloitte.com", active: true, sections: ["Verbal Skills", "Business English", "Comprehension"], question_count: 80 }
];

export async function GET() {
  try {
    const { data: companies } = await supabase
      .from("platform_companies")
      .select("id, name, logo_url, active, sections")
      .eq("active", true);

    if (companies && companies.length > 0) {
      return NextResponse.json({ success: true, data: companies });
    }

    return NextResponse.json({ success: true, data: DEFAULT_COMPANIES });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_COMPANIES });
  }
}

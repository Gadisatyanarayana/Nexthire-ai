import { NextResponse } from "next/server";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

const DEFAULT_COMPANIES = [
  { id: "tcs", name: "TCS (Tata Consultancy Services)", logo_url: "https://logo.clearbit.com/tcs.com", active: true, sections: ["Reasoning Ability", "Seating Arrangement", "Syllogisms & Data Sufficiency"], question_count: 140 },
  { id: "infosys", name: "Infosys", logo_url: "https://logo.clearbit.com/infosys.com", active: true, sections: ["Reasoning Ability", "Cryptarithmetic & Puzzles", "Logical Deductions"], question_count: 110 },
  { id: "wipro", name: "Wipro NLTH", logo_url: "https://logo.clearbit.com/wipro.com", active: true, sections: ["Logical Ability", "Blood Relations & Coding-Decoding", "Direction Sense"], question_count: 100 },
  { id: "accenture", name: "Accenture", logo_url: "https://logo.clearbit.com/accenture.com", active: true, sections: ["Analytical Reasoning", "Abstract Reasoning", "Visual Reasoning"], question_count: 105 },
  { id: "cognizant", name: "Cognizant (GenC)", logo_url: "https://logo.clearbit.com/cognizant.com", active: true, sections: ["Logical Reasoning", "Statement & Assumptions", "Series Completion"], question_count: 90 },
  { id: "deloitte", name: "Deloitte", logo_url: "https://logo.clearbit.com/deloitte.com", active: true, sections: ["Logical Reasoning", "Caselet Analysis", "Decision Making"], question_count: 85 }
];

export async function GET() {
  try {
    const { data: companies } = await supabase
      .from("reasoning_companies")
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

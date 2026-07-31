import { NextResponse } from "next/server";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

const DEFAULT_COMPANIES = [
  { id: "tcs", name: "TCS (Tata Consultancy Services)", logo_url: "https://logo.clearbit.com/tcs.com", active: true, sections: ["Numerical Ability", "Data Interpretation", "Quantitative Speed"], question_count: 150 },
  { id: "infosys", name: "Infosys", logo_url: "https://logo.clearbit.com/infosys.com", active: true, sections: ["Mathematical Ability", "Arithmetic & Algebra", "Permutations & Combinations"], question_count: 120 },
  { id: "wipro", name: "Wipro NLTH", logo_url: "https://logo.clearbit.com/wipro.com", active: true, sections: ["Quantitative Ability", "Time, Speed & Distance", "Percentages & Profit/Loss"], question_count: 110 },
  { id: "accenture", name: "Accenture", logo_url: "https://logo.clearbit.com/accenture.com", active: true, sections: ["Analytical Reasoning", "Quantitative Aptitude", "Chart Interpretation"], question_count: 115 },
  { id: "cognizant", name: "Cognizant (GenC)", logo_url: "https://logo.clearbit.com/cognizant.com", active: true, sections: ["Quantitative Ability", "Ratios & Mixtures", "Geometry & Mensuration"], question_count: 100 },
  { id: "deloitte", name: "Deloitte", logo_url: "https://logo.clearbit.com/deloitte.com", active: true, sections: ["Quantitative Aptitude", "Data Sufficiency", "Probability"], question_count: 95 }
];

export async function GET() {
  try {
    const { data: companies } = await supabase
      .from("apt_companies")
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

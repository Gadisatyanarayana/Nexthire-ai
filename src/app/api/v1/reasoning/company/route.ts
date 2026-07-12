import { NextResponse } from "next/server";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { CompanyEngine } = LearningService;

const supabase = LearningQueryService.getRawClient();

export async function GET() {
  try {
    const { data: companies, error } = await supabase
      .from("reasoning_companies")
      .select("id, name, logo_url, active, sections")
      .eq("active", true);

    if (error) throw error;

    return NextResponse.json({ success: true, data: companies || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

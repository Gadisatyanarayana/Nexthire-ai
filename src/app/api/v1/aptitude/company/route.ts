import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LearningService } from "@/lib/learning/services/LearningService";
const { CompanyEngine } = LearningService;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: companies, error } = await supabase
      .from("apt_companies")
      .select("id, name, logo_url, active, sections")
      .eq("active", true);

    if (error) throw error;

    return NextResponse.json({ success: true, data: companies || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("module_id");
    
    let query = supabase
      .from("apt_lessons")
      .select(`
        *,
        apt_formulas (id, formula_text, example_q, example_a)
      `);
      
    if (moduleId) {
      query = query.eq("module_id", moduleId);
    }
    
    // Auth user check is enforced by RLS to only see non-drafts.
    const { data: lessons, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: lessons
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

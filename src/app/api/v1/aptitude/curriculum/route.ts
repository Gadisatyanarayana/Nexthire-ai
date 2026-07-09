import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Fetch all modules with their lessons and formulas
    const { data: modules, error: modErr } = await supabase
      .from("apt_modules")
      .select(`
        *,
        apt_lessons (
          id, title, difficulty, reading_time, status,
          apt_formulas (id, formula_text)
        )
      `)
      .order("level_order", { ascending: true });

    if (modErr) throw modErr;

    return NextResponse.json({
      success: true,
      data: modules
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lesson_id");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    
    let query = supabase
      .from("apt_questions")
      .select(`
        *,
        apt_company_tags (company_name)
      `, { count: "exact" });
      
    if (lessonId) query = query.eq("lesson_id", lessonId);
    if (difficulty) query = query.eq("difficulty", difficulty);
    
    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: questions, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

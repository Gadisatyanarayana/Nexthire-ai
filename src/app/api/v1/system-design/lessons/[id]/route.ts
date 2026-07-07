import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request, context: any) {
  try {
    const { id } = context.params;

    const { data: lesson, error } = await supabase
      .from("sd_lessons")
      .select(`
        *,
        sd_modules ( title ),
        sd_questions (
          id,
          question,
          options,
          correct_index,
          explanation,
          difficulty,
          company_tags
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
    }

    return NextResponse.json({ lesson });
  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

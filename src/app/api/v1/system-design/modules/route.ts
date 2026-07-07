import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: modules, error } = await supabase
      .from("sd_modules")
      .select(`
        id, 
        title, 
        level_order,
        sd_lessons (
          id,
          title,
          difficulty,
          reading_time
        )
      `)
      .order("level_order", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    // Format the response to match the expected client schema
    const formattedModules = modules.map(mod => ({
      id: mod.id,
      title: mod.title,
      levelOrder: mod.level_order,
      lessons: mod.sd_lessons
    }));

    return NextResponse.json({ modules: formattedModules });
  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

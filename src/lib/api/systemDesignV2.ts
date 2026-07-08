import { createClient } from "@supabase/supabase-js";

// Always use service role or anon key appropriately. For server reads, anon key is fine if RLS allows.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getV2Modules() {
  const { data, error } = await supabaseAdmin
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
    return [];
  }
  return data;
}

export async function getV2Lesson(lessonId: string) {
  const { data, error } = await supabaseAdmin
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
    .eq("id", lessonId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error("Error fetching lesson:", error);
    }
    return null;
  }
  return data;
}

export async function getV2CaseStudies() {
  const { data, error } = await supabaseAdmin
    .from("sd_case_studies")
    .select("id, title, target_scale");

  if (error) {
    return [];
  }
  return data;
}

export async function getV2CaseStudy(caseId: string) {
  const { data, error } = await supabaseAdmin
    .from("sd_case_studies")
    .select("*")
    .eq("id", caseId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error("Error fetching case study:", error);
    }
    return null;
  }
  return data;
}

export async function getV2CompanyProfiles() {
  const { data, error } = await supabaseAdmin
    .from("sd_company_profiles")
    .select("*");

  if (error) {
    return [];
  }
  return data;
}

export async function getV2CompanyProfile(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("sd_company_profiles")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error("Error fetching company profile:", error);
    }
    return null;
  }
  return data;
}

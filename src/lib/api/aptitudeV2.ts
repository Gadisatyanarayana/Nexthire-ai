import { createClient } from "@supabase/supabase-js";
import { AptitudeModule, AptitudeLesson, AptitudeFormula, AptitudeQuestion } from "../../models/aptitude";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize a generic server-side client for fetching public/read-only draft-filtered content.
// User-specific fetches (like mastery) should still use `createServerComponentClient` from `@supabase/auth-helpers-nextjs` in the component if RLS requires user context, 
// but for public curriculum reads, the anon/service key is fine as long as `status != 'draft'` policy handles it (or we explicitly filter here).
const supabase = createClient(supabaseUrl, supabaseKey);

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getServerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;
  const email = session?.user?.email;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");

  if (!isUuid && email) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    if (userRecord?.id) userId = userRecord.id;
    else userId = null;
  }

  if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return userId;
  }
  return null;
}

export async function getModules(): Promise<AptitudeModule[]> {
  const { data, error } = await supabase
    .from("apt_modules")
    .select("*")
    .order("level_order", { ascending: true });
    
  if (error) throw error;
  return data as AptitudeModule[];
}

export async function getModule(id: string): Promise<AptitudeModule | null> {
  const { data, error } = await supabase
    .from("apt_modules")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error && error.code !== "PGRST116") throw error; // PGRST116 is no rows
  return data ? (data as AptitudeModule) : null;
}

export async function getLesson(id: string): Promise<AptitudeLesson | null> {
  const { data, error } = await supabase
    .from("apt_lessons")
    .select("*")
    .eq("id", id)
    // .neq("status", "draft") // Handled by RLS or explicit filter
    .single();
    
  if (error && error.code !== "PGRST116") throw error;
  return data ? (data as AptitudeLesson) : null;
}

export async function getLessonsByModule(moduleId: string): Promise<AptitudeLesson[]> {
  const { data, error } = await supabase
    .from("apt_lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("created_at", { ascending: true });
    
  if (error) throw error;
  return data as AptitudeLesson[];
}

export async function getFormula(id: string): Promise<AptitudeFormula | null> {
  const { data, error } = await supabase
    .from("apt_formulas")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error && error.code !== "PGRST116") throw error;
  return data ? (data as AptitudeFormula) : null;
}

export async function getFormulasByLesson(lessonId: string): Promise<AptitudeFormula[]> {
  const { data, error } = await supabase
    .from("apt_formulas")
    .select("*")
    .eq("topic_id", lessonId)
    .order("created_at", { ascending: true });
    
  if (error) throw error;
  return data as AptitudeFormula[];
}

export async function getQuestionPreview(lessonId: string, limit: number = 3): Promise<AptitudeQuestion[]> {
  const { data, error } = await supabase
    .from("apt_questions")
    .select(`
      *,
      apt_company_tags (company_name)
    `)
    .eq("lesson_id", lessonId)
    .limit(limit);
    
  if (error) throw error;
  return data as AptitudeQuestion[];
}

export async function getUserTopicMastery(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("apt_topic_mastery")
    .select("*")
    .eq("user_id", userId);
    
  if (error) throw error;
  return data || [];
}

export async function getUserRevisionQueue(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("apt_revision_queue")
    .select("*")
    .eq("user_id", userId);
    
  if (error) throw error;
  return data || [];
}

export async function searchAptitudeLessons(query: string): Promise<AptitudeLesson[]> {
  const { data, error } = await supabase
    .from("apt_lessons")
    .select("*")
    .ilike("title", `%${query}%`)
    .limit(10);
    
  if (error) throw error;
  return data as AptitudeLesson[];
}

export async function searchAptitudeFormulas(query: string): Promise<AptitudeFormula[]> {
  const { data, error } = await supabase
    .from("apt_formulas")
    .select("*")
    .ilike("formula_text", `%${query}%`)
    .limit(10);
    
  if (error) throw error;
  return data as AptitudeFormula[];
}

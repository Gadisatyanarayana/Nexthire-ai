import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { AptitudeModule, AptitudeLesson, AptitudeFormula, AptitudeQuestion } from "@/models/aptitude";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class LearningQueryService {
  
  /**
   * Resolves the current user ID securely on the server.
   */
  public static async getServerUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");

    if (!isUuid && email) {
      // Need a raw supabase client for this auth query
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
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

  public static async getModules(): Promise<AptitudeModule[]> {
    // Requires a module repository or raw supabase for now if we don't have ModuleRepo
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_modules").select("*").order("level_order", { ascending: true });
    if (error) throw error;
    return data as AptitudeModule[];
  }

  public static async getModule(id: string): Promise<AptitudeModule | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_modules").select("*").eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? (data as AptitudeModule) : null;
  }

  public static async getLesson(id: string): Promise<AptitudeLesson | null> {
    const repo = RepositoryFactory.getLessonRepository();
    try {
      return await repo.getById(id);
    } catch (error: any) {
      if (error.code !== "PGRST116") throw error;
      return null;
    }
  }

  public static async getLessonsByModule(moduleId: string): Promise<AptitudeLesson[]> {
    const repo = RepositoryFactory.getLessonRepository();
    const lessons = await repo.getByModule(moduleId);
    return lessons.sort((a, b) => {
      const aNum = parseInt(a.id.split('-').pop() || "0", 10) || 0;
      const bNum = parseInt(b.id.split('-').pop() || "0", 10) || 0;
      return aNum - bNum;
    });
  }

  public static async getAllLessons(): Promise<AptitudeLesson[]> {
    const repo = RepositoryFactory.getLessonRepository();
    const lessons = await repo.getAll();
    return lessons.sort((a, b) => {
      if (a.module_id !== b.module_id) {
        return a.module_id.localeCompare(b.module_id);
      }
      const aNum = parseInt(a.id.split('-').pop() || "0", 10) || 0;
      const bNum = parseInt(b.id.split('-').pop() || "0", 10) || 0;
      return aNum - bNum;
    });
  }

  public static async getFormula(id: string): Promise<AptitudeFormula | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_formulas").select("*").eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? (data as AptitudeFormula) : null;
  }

  public static async getFormulasByLesson(lessonId: string): Promise<AptitudeFormula[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_formulas").select("*").eq("topic_id", lessonId).order("created_at", { ascending: true });
    if (error) throw error;
    return data as AptitudeFormula[];
  }

  public static async getQuestionPreview(lessonId: string, limit: number = 3): Promise<AptitudeQuestion[]> {
    const repo = RepositoryFactory.getQuestionRepository();
    return await repo.getByLesson(lessonId, limit);
  }

  public static async getUserTopicMastery(userId: string): Promise<any[]> {
    const repo = RepositoryFactory.getMasteryRepository();
    return await repo.getUserMastery(userId);
  }

  public static async getUserRevisionQueue(userId: string): Promise<any[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_revision_queue").select("*").eq("user_id", userId);
    if (error) throw error;
    return data || [];
  }

  public static async searchAptitudeLessons(query: string): Promise<AptitudeLesson[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: titleData, error: titleError } = await supabase
      .from("apt_lessons")
      .select("*")
      .ilike("title", `%${query}%`)
      .limit(10);
    if (titleError) throw titleError;

    const { data: tagData, error: tagError } = await supabase
      .from("apt_company_tags")
      .select("apt_questions!inner(lesson_id)")
      .ilike("company_name", `%${query}%`)
      .limit(50);
    if (tagError) throw tagError;

    const lessonIds = new Set<string>();
    if (tagData) {
      for (const tag of tagData) {
        const lId = (tag as any).apt_questions?.lesson_id;
        if (lId) lessonIds.add(lId);
      }
    }

    let combined = [...(titleData || [])];
    const existingIds = new Set(combined.map(l => l.id));
    const newIds = Array.from(lessonIds).filter(id => !existingIds.has(id));

    if (newIds.length > 0) {
      const { data: moreLessons, error: moreError } = await supabase
        .from("apt_lessons")
        .select("*")
        .in("id", newIds.slice(0, 10));
      if (moreError) throw moreError;
      if (moreLessons) combined = combined.concat(moreLessons);
    }
    return combined;
  }

  public static async searchAptitudeFormulas(query: string): Promise<AptitudeFormula[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_formulas").select("*").ilike("formula_text", `%${query}%`).limit(10);
    if (error) throw error;
    return data as AptitudeFormula[];
  }

  public static async getMockSession(sessionId: string): Promise<any> {
    const repo = RepositoryFactory.getMockRepository();
    return await repo.getById(sessionId);
  }

  public static async getQuestionsByIds(ids: string[]): Promise<AptitudeQuestion[]> {
    if (!ids || ids.length === 0) return [];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("apt_questions").select("*").in("id", ids);
    if (error) throw error;
    return data as AptitudeQuestion[];
  }
}

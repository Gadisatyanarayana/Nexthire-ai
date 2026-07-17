import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { AptitudeModule, AptitudeLesson, AptitudeFormula, AptitudeQuestion } from "@/models/aptitude";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class LearningQueryService {
  
  public static getRawClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
  }

  public static async getServerUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");

    if (!isUuid && email) {
      const supabase = this.getRawClient();
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

  public static async getModules(subject: string = "aptitude"): Promise<AptitudeModule[]> {
    const supabase = this.getRawClient();
    const domainId = subject === "reasoning" ? "logical-reasoning" : "quantitative-aptitude";
    const { data, error } = await supabase
      .from("platform_modules")
      .select("*")
      .eq("domain_id", domainId)
      .order("level_order", { ascending: true });
    if (error) throw error;
    return data as AptitudeModule[];
  }

  public static async getModule(id: string, subject: string = "aptitude"): Promise<AptitudeModule | null> {
    const supabase = this.getRawClient();
    const { data, error } = await supabase
      .from("platform_modules")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? (data as AptitudeModule) : null;
  }

  public static async getLesson(id: string, subject: string = "aptitude"): Promise<AptitudeLesson | null> {
    const repo = RepositoryFactory.getLessonRepository(subject);
    try {
      return await repo.getById(id);
    } catch (error: any) {
      if (error.code !== "PGRST116") throw error;
      return null;
    }
  }

  public static async getLessonsByModule(moduleId: string, subject: string = "aptitude"): Promise<AptitudeLesson[]> {
    const repo = RepositoryFactory.getLessonRepository(subject);
    const lessons = await repo.getByModule(moduleId);
    return lessons.sort((a, b) => {
      const aNum = parseInt(a.id.split('-').pop() || "0", 10) || 0;
      const bNum = parseInt(b.id.split('-').pop() || "0", 10) || 0;
      return aNum - bNum;
    });
  }

  public static async getAllLessons(subject: string = "aptitude"): Promise<AptitudeLesson[]> {
    const repo = RepositoryFactory.getLessonRepository(subject);
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

  public static async getFormula(id: string, subject: string = "aptitude"): Promise<AptitudeFormula | null> {
    const supabase = this.getRawClient();
    const { data: lessons, error } = await supabase
      .from("platform_lessons")
      .select("id, resources");
    if (error || !lessons) return null;
    for (const lesson of lessons) {
      const formulas = lesson.resources?.formulas || [];
      const found = formulas.find((f: any) => f.id === id);
      if (found) {
        return {
          id: found.id || id,
          topic_id: lesson.id,
          formula_text: found.formula_text || found.text || "",
          example_q: found.example_q || "",
          example_a: found.example_a || "",
          status: "published"
        };
      }
    }
    return null;
  }

  public static async getFormulasByLesson(lessonId: string, subject: string = "aptitude"): Promise<AptitudeFormula[]> {
    const supabase = this.getRawClient();
    const { data: lesson, error } = await supabase
      .from("platform_lessons")
      .select("resources")
      .eq("id", lessonId)
      .single();
    if (error || !lesson) return [];
    const formulas = lesson.resources?.formulas || [];
    return formulas.map((f: any, idx: number) => ({
      id: f.id || `${lessonId}-f-${idx}`,
      topic_id: lessonId,
      formula_text: f.formula_text || f.text || "",
      example_q: f.example_q || "",
      example_a: f.example_a || "",
      status: "published"
    }));
  }

  public static async getQuestionPreview(lessonId: string, limit: number = 3, subject: string = "aptitude"): Promise<AptitudeQuestion[]> {
    const repo = RepositoryFactory.getQuestionRepository(subject);
    return await repo.getByLesson(lessonId, limit);
  }

  public static async getUserTopicMastery(userId: string, subject: string = "aptitude"): Promise<any[]> {
    const repo = RepositoryFactory.getMasteryRepository(subject);
    return await repo.getUserMastery(userId);
  }

  public static async getUserRevisionQueue(userId: string, subject: string = "aptitude"): Promise<any[]> {
    const supabase = this.getRawClient();
    const { data, error } = await supabase
      .from("platform_topic_mastery")
      .select("*, platform_lessons!inner(*)")
      .eq("user_id", userId)
      .not("revision_queue_date", "is", null);
    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: `${m.user_id}-${m.topic_id}`,
      user_id: m.user_id,
      topic_id: m.topic_id,
      next_review_date: m.revision_queue_date,
      created_at: m.created_at,
      topic: m.platform_lessons
    }));
  }

  public static async searchAptitudeLessons(query: string, subject: string = "aptitude"): Promise<AptitudeLesson[]> {
    const domainId = subject === "reasoning" ? "logical-reasoning" : "quantitative-aptitude";
    const supabase = this.getRawClient();
    const { data, error } = await supabase
      .from("platform_lessons")
      .select("*, platform_modules!inner(domain_id)")
      .eq("platform_modules.domain_id", domainId)
      .ilike("title", `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data || [];
  }

  public static async searchAptitudeFormulas(query: string, subject: string = "aptitude"): Promise<AptitudeFormula[]> {
    const domainId = subject === "reasoning" ? "logical-reasoning" : "quantitative-aptitude";
    const supabase = this.getRawClient();
    const { data: lessons, error } = await supabase
      .from("platform_lessons")
      .select("id, resources, platform_modules!inner(domain_id)")
      .eq("platform_modules.domain_id", domainId);
    if (error || !lessons) return [];
    
    const results: AptitudeFormula[] = [];
    for (const lesson of lessons) {
      const formulas = lesson.resources?.formulas || [];
      for (const f of formulas) {
        const text = f.formula_text || f.text || "";
        if (text.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: f.id || `${lesson.id}-f-${results.length}`,
            topic_id: lesson.id,
            formula_text: text,
            example_q: f.example_q || "",
            example_a: f.example_a || "",
            status: "published"
          });
        }
      }
    }
    return results.slice(0, 10);
  }

  public static async getMockSession(sessionId: string, subject: string = "aptitude"): Promise<any> {
    const repo = RepositoryFactory.getMockRepository(subject);
    return await repo.getById(sessionId);
  }

  public static async getQuestionsByIds(ids: string[], subject: string = "aptitude"): Promise<AptitudeQuestion[]> {
    if (!ids || ids.length === 0) return [];
    const supabase = this.getRawClient();
    const { data, error } = await supabase
      .from("platform_questions")
      .select("*")
      .in("id", ids);
    if (error) throw error;
    return data as AptitudeQuestion[];
  }

  public static async generateQuiz(userId: string, options: any): Promise<any> {
    return { success: true, data: [] };
  }

  public static async getReadiness(userId: string): Promise<any> {
    return { success: true, readiness: 50 };
  }

  public static async getReports(userId: string): Promise<any> {
    return { success: true, reports: [] };
  }

  public static async getCoachAdvice(userId: string): Promise<any> {
    return { success: true, advice: "Keep practicing!" };
  }

  public static async searchReasoningLessons(query: string): Promise<AptitudeLesson[]> {
    return this.searchAptitudeLessons(query, "reasoning");
  }

  public static async searchReasoningFormulas(query: string): Promise<AptitudeFormula[]> {
    return this.searchAptitudeFormulas(query, "reasoning");
  }
}

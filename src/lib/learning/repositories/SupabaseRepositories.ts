import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  ILessonRepository, 
  IQuestionRepository, 
  IMockRepository, 
  IMasteryRepository, 
  ICompanyRepository,
  IProgressRepository
} from "./Interfaces";

class SupabaseBaseRepository {
  protected client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  public async beginTransaction(): Promise<void> {
    return Promise.resolve();
  }

  public async commit(): Promise<void> {
    return Promise.resolve();
  }

  public async rollback(): Promise<void> {
    return Promise.resolve();
  }
}

async function withQueryTimeout<T>(queryFn: () => Promise<T>, timeoutMs: number = 300): Promise<T | null> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const res = await Promise.race([queryFn(), timeoutPromise]);
    clearTimeout(timer!);
    return res;
  } catch {
    clearTimeout(timer!);
    return null;
  }
}

export class SupabaseLessonRepository extends SupabaseBaseRepository implements ILessonRepository {
  public async getById(id: string): Promise<any> {
    const res = await withQueryTimeout(async () => {
      const { data, error } = await this.client
        .from("platform_lessons")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    }, 300);
    return res;
  }

  public async getByModule(moduleId: string): Promise<any[]> {
    const res = await withQueryTimeout(async () => {
      const { data, error } = await this.client
        .from("platform_lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("id");
      if (error) return [];
      return data || [];
    }, 300);
    return res || [];
  }

  public async getAll(): Promise<any[]> {
    const res = await withQueryTimeout(async () => {
      const { data: mods } = await this.client
        .from("platform_modules")
        .select("id")
        .eq("domain_id", "quantitative-aptitude");
      const modIds = (mods || []).map((m: any) => m.id);
      if (!modIds.length) return [];
      const { data, error } = await this.client
        .from("platform_lessons")
        .select("*")
        .in("module_id", modIds)
        .order("id");
      if (error) return [];
      return data || [];
    }, 300);
    return res || [];
  }

  public async save(lesson: any): Promise<void> {
    try {
      await this.client.from("platform_lessons").upsert(lesson);
    } catch (e) {
      console.warn("Could not save lesson to remote DB:", e);
    }
  }
}

export class SupabaseQuestionRepository extends SupabaseBaseRepository implements IQuestionRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("platform_questions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getByLesson(lessonId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.client
      .from("platform_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) return data;
    const { getFallbackQuestionsForLesson } = await import("../fallbackQuestions");
    return getFallbackQuestionsForLesson(lessonId, "aptitude", limit);
  }

  public async getByCompany(companyName: string, limit: number): Promise<any[]> {
    const { data, error } = await this.client
      .from("platform_questions")
      .select("*")
      .contains("company_tags", [{ company: companyName }])
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async getRandomSet(limit: number, lessonId?: string): Promise<any[]> {
    let query = this.client.from("platform_questions").select("*");
    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }
    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async save(question: any): Promise<void> {
    const { error } = await this.client
      .from("platform_questions")
      .upsert(question);
    if (error) throw error;
  }
}

export class SupabaseMockRepository extends SupabaseBaseRepository implements IMockRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("platform_mock_sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getUserSessions(userId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.client
      .from("platform_mock_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async createSession(session: any): Promise<void> {
    const { error } = await this.client
      .from("platform_mock_sessions")
      .insert(session);
    if (error) throw error;
  }

  public async updateSession(id: string, updates: any): Promise<void> {
    const { error } = await this.client
      .from("platform_mock_sessions")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  }
}

export class SupabaseMasteryRepository extends SupabaseBaseRepository implements IMasteryRepository {
  public async getUserMastery(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("platform_topic_mastery")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data || [];
  }

  public async getTopicMastery(userId: string, topicId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from("platform_topic_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  public async saveMastery(mastery: any): Promise<void> {
    const { error } = await this.client
      .from("platform_topic_mastery")
      .upsert(mastery);
    if (error) throw error;
  }
}

export class SupabaseCompanyRepository extends SupabaseBaseRepository implements ICompanyRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("platform_companies")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getAll(): Promise<any[]> {
    const { data, error } = await this.client
      .from("platform_companies")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  }

  public async save(company: any): Promise<void> {
    const { error } = await this.client
      .from("platform_companies")
      .upsert(company);
    if (error) throw error;
  }
}

export class SupabaseProgressRepository extends SupabaseBaseRepository implements IProgressRepository {
  public async saveLearningProgress(progress: any): Promise<void> {
    const { error } = await this.client
      .from("learning_progress")
      .upsert(progress, { onConflict: "user_id, content_type, content_id" });
    if (error) throw error;
  }

  public async getLearningProgress(userId: string, contentType: string, contentId: string): Promise<any> {
    const { data, error } = await this.client
      .from("learning_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("is_deleted", false)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  public async logEvent(event: any): Promise<void> {
    const { error } = await this.client
      .from("learning_events")
      .insert(event);
    if (error) throw error;
  }

  public async updateUserStats(stats: any): Promise<void> {
    const { error } = await this.client
      .from("user_stats")
      .upsert(stats, { onConflict: "user_id" });
    if (error) throw error;
  }

  public async getUserStats(userId: string): Promise<any> {
    const { data, error } = await this.client
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  public async recordXPTransaction(transaction: any): Promise<void> {
    const { error } = await this.client
      .from("xp_transactions")
      .insert(transaction);
    if (error) throw error;
  }

  public async startSession(session: any): Promise<void> {
    const { error } = await this.client
      .from("learning_sessions")
      .insert(session);
    if (error) throw error;
  }

  public async endSession(sessionId: string, duration: number): Promise<void> {
    const { error } = await this.client
      .from("learning_sessions")
      .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
      .eq("id", sessionId);
    if (error) throw error;
  }

  public async saveDailyActivity(activity: any): Promise<void> {
    const { error } = await this.client
      .from("daily_activity")
      .upsert(activity, { onConflict: "user_id, activity_date" });
    if (error) throw error;
  }
}

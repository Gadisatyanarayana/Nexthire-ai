import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  ILessonRepository, 
  IQuestionRepository, 
  IMockRepository, 
  IMasteryRepository, 
  ICompanyRepository 
} from "../../learning/repositories/Interfaces";

class SupabaseReasoningBaseRepository {
  protected client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  public async beginTransaction(): Promise<void> {
    // Supabase has implicit transaction boundaries on single RPC calls or batch writes.
    // For local transactions in PostgreSQL, we could run raw sql, but we map standard calls here.
    return Promise.resolve();
  }

  public async commit(): Promise<void> {
    return Promise.resolve();
  }

  public async rollback(): Promise<void> {
    return Promise.resolve();
  }
}

export class SupabaseReasoningLessonRepository extends SupabaseReasoningBaseRepository implements ILessonRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("reasoning_lessons")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getByModule(moduleId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("id");
    if (error) throw error;
    return data || [];
  }

  public async getAll(): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_lessons")
      .select("*")
      .order("id");
    if (error) throw error;
    return data || [];
  }

  public async save(lesson: any): Promise<void> {
    const { error } = await this.client
      .from("reasoning_lessons")
      .upsert(lesson);
    if (error) throw error;
  }
}

export class SupabaseReasoningQuestionRepository extends SupabaseReasoningBaseRepository implements IQuestionRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("reasoning_questions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getByLesson(lessonId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async getByCompany(companyName: string, limit: number): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_questions")
      .select("*, apt_company_tags!inner (company_name)")
      .ilike("reasoning_company_tags.company_name", companyName)
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async getRandomSet(limit: number, lessonId?: string): Promise<any[]> {
    let query = this.client.from("reasoning_questions").select("*");
    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }
    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async save(question: any): Promise<void> {
    const { error } = await this.client
      .from("reasoning_questions")
      .upsert(question);
    if (error) throw error;
  }
}

export class SupabaseReasoningMockRepository extends SupabaseReasoningBaseRepository implements IMockRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("reasoning_mock_sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getUserSessions(userId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_mock_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  public async createSession(session: any): Promise<void> {
    const { error } = await this.client
      .from("reasoning_mock_sessions")
      .insert(session);
    if (error) throw error;
  }

  public async updateSession(id: string, updates: any): Promise<void> {
    const { error } = await this.client
      .from("reasoning_mock_sessions")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  }
}

export class SupabaseReasoningMasteryRepository extends SupabaseReasoningBaseRepository implements IMasteryRepository {
  public async getUserMastery(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_topic_mastery")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data || [];
  }

  public async getTopicMastery(userId: string, topicId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from("reasoning_topic_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  public async saveMastery(mastery: any): Promise<void> {
    const { error } = await this.client
      .from("reasoning_topic_mastery")
      .upsert(mastery);
    if (error) throw error;
  }
}

export class SupabaseReasoningCompanyRepository extends SupabaseReasoningBaseRepository implements ICompanyRepository {
  public async getById(id: string): Promise<any> {
    const { data, error } = await this.client
      .from("reasoning_companies")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  public async getAll(): Promise<any[]> {
    const { data, error } = await this.client
      .from("reasoning_companies")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  }

  public async save(company: any): Promise<void> {
    const { error } = await this.client
      .from("reasoning_companies")
      .upsert(company);
    if (error) throw error;
  }
}

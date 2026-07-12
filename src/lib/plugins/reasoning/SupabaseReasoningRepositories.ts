import { createClient } from "@supabase/supabase-js";
import { ILessonRepository, IQuestionRepository, IMockRepository, IMasteryRepository, ICompanyRepository } from "../../learning/repositories/Interfaces";

// Re-using the same generic interfaces for the Reasoning plugin
// They will implement them but query 'reasoning_' tables.

function getRawClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export class SupabaseReasoningLessonRepository implements ILessonRepository {
  async getById(id: string): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_lessons").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }
  async getByModule(moduleId: string): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_lessons").select("*").eq("module_id", moduleId);
    if (error) throw error;
    return data;
  }
  async getAll(): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_lessons").select("*");
    if (error) throw error;
    return data;
  }
}

export class SupabaseReasoningQuestionRepository implements IQuestionRepository {
  async getById(id: string): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_questions").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }
  async getByLesson(lessonId: string): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_questions").select("*").eq("lesson_id", lessonId);
    if (error) throw error;
    return data;
  }
  async getByCompany(companyId: string): Promise<any[]> {
    return []; // Requires joining reasoning_company_tags
  }
  async getRandom(limit: number): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_questions").select("*").limit(limit);
    if (error) throw error;
    return data;
  }
}

export class SupabaseReasoningMockRepository implements IMockRepository {
  async getById(id: string): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_mock_sessions").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }
  async createSession(session: any): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_mock_sessions").insert(session).select().single();
    if (error) throw error;
    return data;
  }
  async updateSession(id: string, updates: any): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_mock_sessions").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
  async getUserHistory(userId: string): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_mock_sessions").select("*").eq("user_id", userId);
    if (error) throw error;
    return data;
  }
}

export class SupabaseReasoningMasteryRepository implements IMasteryRepository {
  async getTopicMastery(userId: string, topicId: string): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_topic_mastery").select("*").eq("user_id", userId).eq("topic_id", topicId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  async getAllUserMastery(userId: string): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_topic_mastery").select("*").eq("user_id", userId);
    if (error) throw error;
    return data;
  }
  async saveMastery(mastery: any): Promise<void> {
    const { error } = await getRawClient().from("reasoning_topic_mastery").upsert(mastery);
    if (error) throw error;
  }
}

export class SupabaseReasoningCompanyRepository implements ICompanyRepository {
  async getById(id: string): Promise<any> {
    const { data, error } = await getRawClient().from("reasoning_companies").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }
  async getAll(): Promise<any[]> {
    const { data, error } = await getRawClient().from("reasoning_companies").select("*");
    if (error) throw error;
    return data;
  }
}

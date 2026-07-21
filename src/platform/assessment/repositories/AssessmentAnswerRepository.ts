import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AssessmentAnswer {
  id: string;
  tenant_id: string;
  user_id: string;
  attempt_id: string;
  question_id: string;
  answer_data: any;
  is_correct?: boolean;
  score?: number;
  saved_at: Date;
}

export class AssessmentAnswerRepository {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    if (client) {
      this.supabase = client;
    } else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async upsertAnswer(
    tenantId: string,
    userId: string,
    attemptId: string,
    questionId: string,
    answerData: any
  ): Promise<AssessmentAnswer> {
    
    // We use an upsert based on the unique constraint (attempt_id, question_id)
    const { data, error } = await this.supabase
      .from('assessment_answers')
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        attempt_id: attemptId,
        question_id: questionId,
        answer_data: answerData,
        saved_at: new Date().toISOString()
      }, { onConflict: 'attempt_id, question_id' })
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert answer: ${error.message}`);
    return data;
  }

  async getAnswersForAttempt(attemptId: string): Promise<AssessmentAnswer[]> {
    const { data, error } = await this.supabase
      .from('assessment_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    if (error) throw new Error(`Failed to get answers: ${error.message}`);
    return data || [];
  }
}

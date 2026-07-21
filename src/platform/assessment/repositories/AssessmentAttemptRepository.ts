import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AssessmentAttempt {
  id: string;
  tenant_id: string;
  user_id: string;
  assessment_id: string;
  status: 'DRAFT' | 'STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ARCHIVED';
  score?: number;
  max_score?: number;
  earned_score?: number;
  is_passed?: boolean;
  percentage?: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  attempt_number: number;
  started_at: Date;
  submitted_at?: Date;
  time_elapsed_seconds: number;
}

export class AssessmentAttemptRepository {
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

  async createAttempt(
    tenantId: string, 
    userId: string, 
    assessmentId: string
  ): Promise<AssessmentAttempt> {
    
    // First, verify if an active attempt exists
    const activeAttempt = await this.getActiveAttempt(tenantId, userId, assessmentId);
    if (activeAttempt) {
      throw new Error("User already has an active attempt for this assessment.");
    }

    // Determine attempt number
    const { data: previousAttempts } = await this.supabase
      .from('assessment_attempts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId);
    
    const attemptNumber = (previousAttempts?.length || 0) + 1;

    const { data, error } = await this.supabase
      .from('assessment_attempts')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        assessment_id: assessmentId,
        status: 'STARTED',
        attempt_number: attemptNumber
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create attempt: ${error.message}`);
    return data;
  }

  async getActiveAttempt(tenantId: string, userId: string, assessmentId: string): Promise<AssessmentAttempt | null> {
    const { data, error } = await this.supabase
      .from('assessment_attempts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .in('status', ['STARTED', 'IN_PROGRESS'])
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateAttemptStatus(
    attemptId: string, 
    status: AssessmentAttempt['status'], 
    timeElapsedSeconds?: number
  ): Promise<AssessmentAttempt> {
    const updates: any = { status };
    if (timeElapsedSeconds !== undefined) {
      updates.time_elapsed_seconds = timeElapsedSeconds;
    }
    if (status === 'SUBMITTED') {
      updates.submitted_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('assessment_attempts')
      .update(updates)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update attempt status: ${error.message}`);
    return data;
  }

  async completeGrading(
    attemptId: string,
    results: {
      score: number;
      maxScore: number;
      earnedScore: number;
      isPassed: boolean;
      percentage: number;
      correctAnswers: number;
      incorrectAnswers: number;
      unanswered: number;
    }
  ): Promise<AssessmentAttempt> {
    const { data, error } = await this.supabase
      .from('assessment_attempts')
      .update({
        status: 'GRADED',
        score: results.score,
        max_score: results.maxScore,
        earned_score: results.earnedScore,
        is_passed: results.isPassed,
        percentage: results.percentage,
        correct_answers: results.correctAnswers,
        incorrect_answers: results.incorrectAnswers,
        unanswered: results.unanswered
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw new Error(`Failed to grade attempt: ${error.message}`);
    return data;
  }
}

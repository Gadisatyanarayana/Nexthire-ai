import { SupabaseClient } from '@supabase/supabase-js';
import { Result, success, failure } from '../../../packages/result';
import { BaseError } from '../../../packages/errors';
import { Question } from '../../../packages/contracts/question';

export class QuestionVersionService {
  constructor(private supabase: SupabaseClient) {}

  async createVersion(questionId: string, content: any, createdBy: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('platform_questions_versions')
      .insert({
        question_id: questionId,
        content: content,
        created_by: createdBy,
        version_number: 1 // In reality, fetch latest and increment
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id;
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '@/services/BaseRepository';
import { Question } from '../../../packages/contracts/question';

export class QuestionRepository extends BaseRepository<Question> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'platform_questions');
  }

  async getQuestionsByDomain(domainId: string, limit = 50): Promise<Question[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('domain_id', domainId)
      .limit(limit);
      
    if (error) throw new Error(`Fetch error: ${error.message}`);
    return data as Question[];
  }
}

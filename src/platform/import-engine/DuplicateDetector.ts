import { SupabaseClient } from '@supabase/supabase-js';

export interface DuplicateMatch {
  question_id: string;
  confidence: number; // 0.0 to 1.0
  match_type: 'ExactHash' | 'Levenshtein' | 'Trigram' | 'Semantic';
}

export class DuplicateDetector {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Multi-pass duplicate detection strategy.
   * 1. Hash match (O(1))
   * 2. Trigram match (Indexed)
   * 3. Levenshtein distance (Row-level)
   * 4. Semantic Similarity (pgvector)
   */
  async detect(normalizedTitle: string, optionsHash?: string): Promise<DuplicateMatch | null> {
    // 1. Hash match (Placeholder for exact hash lookup)
    const { data: exactMatch } = await this.supabase
      .from('platform_questions')
      .select('id')
      .eq('title_hash', this.hashString(normalizedTitle))
      .limit(1)
      .single();

    if (exactMatch) {
      return { question_id: exactMatch.id, confidence: 1.0, match_type: 'ExactHash' };
    }

    // 2. Trigram & Levenshtein would utilize custom Postgres functions
    // e.g., SELECT id, similarity(title, $1) as sim FROM ... WHERE title % $1

    // 3. Semantic Similarity (Future pgvector integration)

    return null;
  }

  private hashString(str: string): string {
    // In node, crypto.createHash('sha256').update(str).digest('hex')
    return str; 
  }
}

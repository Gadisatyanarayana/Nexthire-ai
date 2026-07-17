import { BackgroundWorker } from './WorkerRegistry';
import { DomainEvent } from '../../packages/contracts/events';
import { SupabaseClient } from '@supabase/supabase-js';

export class SearchWorker implements BackgroundWorker {
  name = 'SearchWorker';

  constructor(private supabase: SupabaseClient) {}

  async handleEvent(event: DomainEvent): Promise<void> {
    if (event.type === 'QuestionPublished') {
      const { questionId, versionId } = event.payload;
      
      // Fetch the full Question + Version content
      const { data: q } = await this.supabase
        .from('platform_questions_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (!q) return;

      // In production, this pushes to ElasticSearch / Meilisearch / Algolia
      // or updates a dedicated TSVECTOR column in Postgres
      console.log(`[SearchWorker] Indexed Question ${questionId}`);
    }
  }
}

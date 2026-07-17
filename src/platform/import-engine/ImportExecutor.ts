import { SupabaseClient } from '@supabase/supabase-js';
import { ImportJobManager } from './ImportJobManager';

export class ImportExecutor {
  constructor(private supabase: SupabaseClient, private jobManager: ImportJobManager) {}

  /**
   * Pushes the validated, non-duplicate rows directly into the Staging tables.
   * This operates in bulk mode for performance.
   */
  async executeToStaging(jobId: string, rows: Record<string, any>[]): Promise<void> {
    if (rows.length === 0) return;

    // Attach batch ID to all rows
    const payload = rows.map(r => ({
      ...r,
      import_batch_id: jobId,
      validation_status: 'Valid'
    }));

    const { error } = await this.supabase
      .from('platform_questions_staging')
      .insert(payload);

    if (error) {
      throw new Error(`Failed to execute batch ${jobId} to staging: ${error.message}`);
    }

    // Update job tracking
    await this.jobManager.updateStatus(jobId, 'AwaitingApproval');
  }
}

export class ImportRollback {
  constructor(private supabase: SupabaseClient, private jobManager: ImportJobManager) {}

  /**
   * Rolls back an import batch safely.
   * Deletes from import_batches which cascades ONLY to unmodified rows via batch_items.
   */
  async rollbackBatch(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('import_batches')
      .delete()
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to rollback batch ${jobId}: ${error.message}`);
    }

    // Since the job is deleted, the cascade destroys staging rows automatically.
  }
}

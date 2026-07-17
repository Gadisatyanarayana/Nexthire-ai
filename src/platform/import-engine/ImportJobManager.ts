import { SupabaseClient } from '@supabase/supabase-js';
import { ImportJob, ImportJobStatus } from '../../../packages/contracts/import';
import { BaseRepository } from '../BaseRepository';

export class ImportRepository extends BaseRepository<ImportJob> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'import_batches');
  }

  async getJobsByStatus(status: ImportJobStatus): Promise<ImportJob[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Error fetching jobs by status: ${error.message}`);
    return data as ImportJob[];
  }
}

export class ImportJobManager {
  private repo: ImportRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new ImportRepository(supabase);
  }

  async createJob(filename: string, userId: string): Promise<ImportJob> {
    return await this.repo.create({
      filename,
      uploaded_by: userId,
      status: 'Queued',
      total_rows: 0,
      inserted_rows: 0,
      skipped_rows: 0,
      failed_rows: 0
    });
  }

  async updateStatus(jobId: string, status: ImportJobStatus): Promise<ImportJob> {
    return await this.repo.update(jobId, { status });
  }
}

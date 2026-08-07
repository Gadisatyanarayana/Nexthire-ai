import { db } from '../../../db'; // Assuming there's a db export
import { resumeAIJobs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AILogger } from '../observability/AILogger';

export type AIJobType = 'PARSE' | 'ATS_REVIEW' | 'JD_MATCH' | 'COVER_LETTER' | 'CAREER_COACH' | 'BULLET_REWRITE';

export interface EnqueueJobArgs {
  resumeId: string;
  jobType: AIJobType;
  payload: any;
}

export class PostgresAIQueue {
  static async enqueue(args: EnqueueJobArgs): Promise<string> {
    try {
      const [job] = await db.insert(resumeAIJobs).values({
        resumeId: args.resumeId,
        jobType: args.jobType,
        status: 'PENDING',
        payload: args.payload,
      }).returning({ id: resumeAIJobs.id });
      
      AILogger.info(`Enqueued AI Job ${args.jobType}`, {
        requestId: job.id,
        resumeId: args.resumeId,
        provider: 'queue',
        model: 'postgres'
      });

      return job.id;
    } catch (error) {
      AILogger.error(`Failed to enqueue job`, error, {
        requestId: 'enqueue',
        resumeId: args.resumeId,
        provider: 'queue',
        model: 'postgres'
      });
      throw error;
    }
  }

  static async updateStatus(jobId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING', result?: any, error?: string) {
    await db.update(resumeAIJobs)
      .set({ status, result, error, updatedAt: new Date() })
      .where(eq(resumeAIJobs.id, jobId));
  }

  static async getJobStatus(jobId: string) {
    const [job] = await db.select().from(resumeAIJobs).where(eq(resumeAIJobs.id, jobId));
    return job;
  }
}

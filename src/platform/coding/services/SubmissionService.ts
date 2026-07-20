import { WebhookService } from '@/platform/integrations/services/WebhookService';

export class SubmissionService {
  /**
   * Handles the callback from the Code Execution Engine (Judge).
   * Persists the result and pushes to the transactional outbox.
   */
  public static async handleJudgeCallback(
    tenantId: string,
    submissionId: string,
    problemId: string,
    result: { status: string; timeMs: number; memoryKb: number }
  ) {
    // 1. Begin Transaction
    // ... DB UPDATE platform_submissions ...

    // 2. Insert into Outbox (in same transaction)
    await WebhookService.publishToOutbox(tenantId, 'CodingSubmitted.v1', {
      submissionId,
      problemId,
      language: 'python',
      status: result.status,
      timeMs: result.timeMs,
      memoryKb: result.memoryKb
    });

    // 3. Commit Transaction
    
    return { success: true };
  }
}

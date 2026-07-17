import { QueueProvider } from '../../contracts/coding/queue';
import { CodingSubmission } from '../../contracts/coding/submission';

export class RejudgeEngine {
  constructor(private queue: QueueProvider) {}

  /**
   * Pushes a submission into the dedicated Rejudge Queue.
   * Ensures the judge re-evaluates it without impacting Live traffic capacity.
   */
  public async submitForRejudge(submission: CodingSubmission, priorityOverride?: number): Promise<void> {
    await this.queue.enqueue({
      submissionId: submission.id,
      problemId: submission.problemId,
      language: submission.language,
      priority: priorityOverride ?? 100, // Rejudges typically have very high priority
      tenantId: submission.tenantId
    });
  }
}

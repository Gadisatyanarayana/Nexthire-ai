export interface SubmissionQueueItem {
  submissionId: string;
  problemId: string;
  language: string;
  priority: number; // e.g. Contest=High, Normal=Medium
  tenantId: string;
}

export interface QueueProvider {
  enqueue(item: SubmissionQueueItem): Promise<void>;
  dequeue(queueName: string): Promise<SubmissionQueueItem | null>;
  ack(submissionId: string): Promise<void>;
  nack(submissionId: string): Promise<void>;
}

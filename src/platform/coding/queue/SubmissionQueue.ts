import { QueueProvider, SubmissionQueueItem } from '../../contracts/queue';

/**
 * Multi-Tenant Priority Queue Implementation
 * Backed by Redis/BullMQ in production.
 */
export class SubmissionQueue implements QueueProvider {
  private queues: Map<string, SubmissionQueueItem[]> = new Map();

  constructor() {
    this.queues.set('normal', []);
    this.queues.set('contest', []);
    this.queues.set('faculty', []);
    this.queues.set('ai_eval', []);
  }

  public async enqueue(item: SubmissionQueueItem): Promise<void> {
    const queueName = this.determineQueue(item);
    const q = this.queues.get(queueName);
    
    if (q) {
      // Very naive priority insert for demonstration
      q.push(item);
      q.sort((a, b) => b.priority - a.priority);
    }
  }

  public async dequeue(queueName: string): Promise<SubmissionQueueItem | null> {
    const q = this.queues.get(queueName);
    return q && q.length > 0 ? q.shift()! : null;
  }

  public async ack(submissionId: string): Promise<void> {
    // Ack message in real message broker
  }

  public async nack(submissionId: string): Promise<void> {
    // Return to queue or DLQ
  }

  private determineQueue(item: SubmissionQueueItem): string {
    // Routing logic based on priority or origin context
    if (item.priority >= 100) return 'contest';
    if (item.priority >= 50) return 'faculty';
    if (item.priority < 0) return 'ai_eval';
    return 'normal';
  }
}

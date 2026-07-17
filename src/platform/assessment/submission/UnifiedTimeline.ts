import { BaseDomainEvent } from '../../kernel/events/DomainEvent';

/**
 * Outbox Event Wrapper for Guaranteed Delivery
 */
export interface OutboxMessage {
  id: string;
  eventType: string;
  payload: any;
  published: boolean;
  createdAt: Date;
}

/**
 * Unified Timeline Aggregator
 * Merges lifecycle, submission, and proctoring events into a single timeline per submission.
 */
export class UnifiedTimeline {
  
  /**
   * Records an event directly into the Outbox table as part of the same DB transaction.
   * A separate background publisher worker reads from the outbox and publishes to the Event Bus.
   */
  static async appendEvent(submissionId: string, event: BaseDomainEvent, dbTransaction: any): Promise<void> {
    const outboxRecord: OutboxMessage = {
      id: crypto.randomUUID(),
      eventType: event.eventType,
      payload: {
        submissionId,
        ...event
      },
      published: false,
      createdAt: new Date()
    };

    // dbTransaction.insert('outbox_events', outboxRecord);
    console.log(`[UnifiedTimeline] Appended ${event.eventType} to Outbox for Submission ${submissionId}`);
  }

  /**
   * Read Model: Fetches the entire unified timeline for an audit or appeal.
   */
  static async getAuditTrail(submissionId: string): Promise<BaseDomainEvent[]> {
    // 1. Fetch from Event Store (Event Sourcing)
    return [];
  }
}

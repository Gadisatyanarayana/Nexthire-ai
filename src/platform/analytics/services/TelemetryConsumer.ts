import { EventIngestionPayload } from '../../contracts/analytics';
import { AnalyticsAggregate } from '../domain/AnalyticsAggregate';

export class TelemetryConsumer {
  private inMemoryStore: Map<string, AnalyticsAggregate> = new Map();

  /**
   * Simulates processing an event from the Event Bus Outbox.
   */
  public async handleEvent(event: EventIngestionPayload): Promise<void> {
    let aggregate = this.inMemoryStore.get(event.userId);

    if (!aggregate) {
      // Typically we would hydrate this from the Database or Redis Cache
      aggregate = AnalyticsAggregate.initializeScorecard(event.userId, event.tenantId);
      this.inMemoryStore.set(event.userId, aggregate);
    }

    // Apply the incoming domain event to our materialized Read Model
    aggregate.applyEvent(event);

    // Normally we would persist the updated scorecard back to Redis / Postgres here
  }

  /**
   * Retrieves the current analytics scorecard for a given user.
   */
  public async getScorecard(userId: string): Promise<AnalyticsAggregate | null> {
    return this.inMemoryStore.get(userId) || null;
  }
}

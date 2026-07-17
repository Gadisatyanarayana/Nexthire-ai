import { DomainEvent } from '../../../packages/contracts/events';
import { Result, success, failure } from '../../../packages/result';
import { InfrastructureError } from '../../../packages/errors';

type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private history: DomainEvent[] = [];
  private dlq: { event: DomainEvent; error: any }[] = [];

  subscribe(eventType: DomainEvent['type'], handler: EventHandler) {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(event: DomainEvent): Promise<Result<boolean, InfrastructureError>> {
    // 1. Record History (Audit/Replay)
    this.history.push(event);

    const typeHandlers = this.handlers.get(event.type) || [];
    
    // 2. Execute Handlers asynchronously
    for (const handler of typeHandlers) {
      try {
        await this.executeWithRetry(handler, event);
      } catch (e: any) {
        // 3. Dead Letter Queue
        this.dlq.push({ event, error: e });
        console.error(`Event ${event.type} failed after retries. Moved to DLQ.`);
      }
    }

    return success(true);
  }

  private async executeWithRetry(handler: EventHandler, event: DomainEvent, maxRetries = 3): Promise<void> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await handler(event);
        return; // Success
      } catch (e: any) {
        attempt++;
        if (attempt >= maxRetries) throw e;
        // Exponential backoff
        await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
      }
    }
  }

  // 4. Replay System
  async replayFromHistory(eventId: string): Promise<void> {
    const event = this.history.find(e => e.eventId === eventId);
    if (!event) throw new Error("Event not found in history");
    await this.publish(event);
  }

  getMetrics() {
    return {
      historyCount: this.history.length,
      dlqCount: this.dlq.length,
      registeredHandlers: this.handlers.size
    };
  }
}

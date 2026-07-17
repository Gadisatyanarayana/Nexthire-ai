/**
 * Platform Kernel: Domain Event Base Contract
 * Enforces the frozen event structure for Outbox and Pub/Sub mechanics.
 */

export interface DomainEvent {
  eventId: string;           // Idempotency key
  eventType: string;         // e.g., 'AssessmentPublished.v1'
  timestamp: number;         // Epoch ms
  producer: string;          // Bounded context owner (e.g., 'assessment-lifecycle')
  tenantId?: string;         // Multi-tenant isolation boundary
  payload: Record<string, any>;
}

/**
 * Ensures strict schema adherence for all domain events.
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: number;

  constructor(
    public readonly eventType: string,
    public readonly producer: string,
    public readonly payload: Record<string, any>,
    public readonly tenantId?: string
  ) {
    // Generate secure ULID/UUID in production
    this.eventId = crypto.randomUUID(); 
    this.timestamp = Date.now();
  }
}

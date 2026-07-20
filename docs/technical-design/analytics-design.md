# Analytics Platform: Technical Design

## 1. Overview
The Enterprise Analytics Platform is a CQRS-based bounded context that acts as a downstream consumer of telemetry events emitted by various operational systems (Assessment, Coding, Voice, Learning). It maintains materialized read models (`AnalyticsAggregate`) optimized for high-performance dashboard queries.

## 2. Event Schemas
All events dispatched to the Analytics domain follow a strict versioned schema.

### 2.1 `AssessmentCompleted.v1`
```json
{
  "eventId": "uuid",
  "eventType": "AssessmentCompleted.v1",
  "tenantId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO8601",
  "metrics": {
    "efficiency": "number (0-100)",
    "retention": "number (0-100)"
  }
}
```

### 2.2 `CodingSubmitted.v1`
```json
{
  "eventId": "uuid",
  "eventType": "CodingSubmitted.v1",
  "tenantId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO8601",
  "metrics": {
    "score": "number (0-100)"
  }
}
```

## 3. Idempotency & Deduplication
To ensure `AnalyticsAggregate` scores remain accurate under 'at-least-once' delivery guarantees:
- **Event Journaling**: Every processed `eventId` is logged in an `analytics_processed_events` table.
- **Idempotency Check**: Before `TelemetryConsumer` applies an event, it verifies the `eventId` does not exist in the journal. Duplicate events are acknowledged but discarded.

## 4. Event Ordering & Late Arrival Handling
- Events are naturally ordered by their `timestamp` payload rather than ingestion time.
- **Out-of-Order Projection Recomputation**: If an event arrives significantly late (e.g., an offline system reconnects), the `TelemetryConsumer` queues a projection rebuild for that specific `userId` starting from the event's chronological insertion point, leveraging the Event Store.

## 5. Backfill & Projection Rebuild Strategy
If analytical algorithms change (e.g., modifying the Exponential Moving Average weights for coding scores):
1. A new projection schema/version is instantiated (e.g., `CandidateScorecard_v2`).
2. A background worker replays the entire event log from the immutable Event Store into the new projection.
3. Once caught up, the API routes are flipped to query the new `v2` materialized view.
4. The old projection is dropped.

## 6. Performance & SLO Targets
- **Ingestion Throughput**: Capable of processing 5,000 telemetry events per second per node.
- **Projection Latency (P99)**: Under 250ms from event emission to materialized view update.
- **Query Latency (P99)**: Under 150ms for Dashboard API endpoints fetching `CandidateScorecard`.

## 7. Access Control
Analytics read models are heavily tenant-isolated.
- APIs require a valid Bearer token bound to an authorized Role.
- Query filters natively append `WHERE tenant_id = current_tenant_id()`.
- Policy-Based Access Control (PBAC) governs visibility (e.g., `Faculty` can only view aggregates for their assigned `cohort_id`).

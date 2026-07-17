# Assessment Domain Events Catalog
Version: 1.0.0

This catalog defines the frozen v1 event contracts emitted by the Assessment Context. These events are the ONLY approved mechanism for cross-domain orchestration.

## 1. AssessmentPublished.v1
**Producer**: Assessment Lifecycle Engine
**Consumers**: Notification Scheduler, Search Indexer
**Payload**:
```json
{
  "eventId": "uuid",
  "assessmentId": "uuid",
  "publishedAt": "timestamp",
  "metadata": {
    "title": "string",
    "domainId": "string"
  }
}
```
**Idempotency**: Consumers MUST handle duplicate deliveries via `eventId` deduplication.

## 2. AssessmentCompleted.v1
**Producer**: Assessment Lifecycle Engine
**Consumers**: Recommendation Engine, Faculty Analytics Aggregator
**Payload**:
```json
{
  "eventId": "uuid",
  "assessmentId": "uuid",
  "userId": "uuid",
  "completedAt": "timestamp",
  "finalScore": "number",
  "psychometricRiskScore": "number"
}
```
**Retry Behavior**: Exponential backoff up to 24 hours. DLQ on failure.

# Coding API Contracts (Frozen)

This defines the REST boundaries for the Execution Engine.

## Submissions API

### `POST /api/v1/coding/submit`
Enqueues a submission into the Priority Queue.
**Request**:
```json
{
  "problemId": "uuid",
  "language": "python",
  "sourceCode": "print('hello')",
  "context": {
    "type": "CONTEST",
    "contestId": "uuid"
  }
}
```
**Response**: `202 Accepted`
```json
{
  "submissionId": "uuid",
  "status": "PENDING"
}
```

### `GET /api/v1/coding/submissions/:id/status`
Polls for execution status.
**Response**:
```json
{
  "submissionId": "uuid",
  "status": "COMPLETED",
  "verdict": "AC",
  "runtimeMs": 12,
  "memoryKb": 1024
}
```

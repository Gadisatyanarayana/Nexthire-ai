# Contest Production Readiness Review (PRR)

The required gates for passing M6.

## Functional Correctness
- **PRR-1 (Lifecycle)**: `Draft` -> `Publish` -> `Start` -> `Pause` -> `Resume` -> `End` transitions succeed.
- **PRR-2 (Registration)**: Registration policies enforce Capacity and Whitelisting bounds.
- **PRR-3 (Snapshot)**: `SHA-256` integrity matches between published blueprint and participant session.
- **PRR-4 (Scoring)**: ACM vs IOI rules calculate points accurately against test cases.
- **PRR-5 (Leaderboard)**: Redis Sorted Sets maintain exact parity with SQL Read Models.
- **PRR-6 (Clarifications)**: Moderator responses broadcast to all active sessions via SSE.
- **PRR-7 (Rejudge)**: Changing a test case triggers mass re-evaluate and propagates to Leaderboard.
- **PRR-8 (Rating)**: Post-contest ELO updates correctly based on final rank.

## Performance Constraints
- **PRR-9 (Performance)**:
  - Leaderboard read latency `<100ms` at p95 (Redis cache hit).
  - Broadcast propagation `<200ms` (Event Bus -> WebSocket).
  - Queue latency `<50ms` (Submission -> Enqueued).
  - Judge propagation `<300ms` (Judge -> Leaderboard ZADD).

## Operational Integrity
- **PRR-10 (Security)**: Plagiarism engine catches AST isomorphism.
- **PRR-11 (Operational Resilience)**:
  - `Pause/Resume` correctly holds and releases the Submission Queue.
  - Redis cluster failover retains leaderboard state via AOF sync.
  - Worker crash correctly NACKs to DLQ.
- **PRR-12 (End-to-End Validation)**: Full lifecycle execution of Faculty creating a contest, students registering, freezing leaderboard, and finalizing ratings.

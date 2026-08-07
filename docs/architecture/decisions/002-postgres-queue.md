# ADR-002: PostgreSQL-Backed Queue for Phase 1 AI Jobs

## Status
Accepted

## Context
Resume Intelligence generation, ATS analysis, and Voice Interview context preparation require multiple sequential LLM calls. These calls can take anywhere from 3 to 20 seconds depending on the provider and payload size. Executing these synchronously in a Next.js API route will lead to Vercel/gateway timeouts (504s) and degrade the user experience.

## Decision
We will implement an async job queue backed by PostgreSQL (`resume_ai_jobs` table) instead of introducing a dedicated queueing infrastructure like Redis/BullMQ or AWS SQS.

## Consequences
- **Pros:**
  - Radically simplifies infrastructure for Phase 1. No extra databases or services to maintain, monitor, or pay for.
  - Transactional consistency guarantees. AI Jobs live in the same database as the Resume and Intelligence models.
  - Sufficient scale: A well-indexed Postgres queue can easily handle thousands of jobs per minute, which is more than enough for up to 5,000+ early users.
- **Cons:**
  - Polling or listening to PostgreSQL NOTIFY events adds slight latency compared to in-memory queues.
  - When scaling to 100,000+ users, the polling mechanism will stress the database and require migration to a memory-first queue (like Redis).

# ADR-0001: Domain-Driven Design Boundaries

## Status
Accepted

## Context
As NextHire AI scales to support over 100,000 questions and millions of submissions, a monolithic architecture will lead to rapid degradation of maintainability and massive technical debt. We are evolving the platform from a feature-driven LMS to a comprehensive Placement Ecosystem consisting of Assessments, Coding, Contests, AI, and Placement Hubs.

## Decision
We are adopting strict Domain-Driven Design (DDD) principles. The system is segregated into isolated Bounded Contexts.
Contexts MUST NEVER directly depend on each other's concrete implementations.

### Context Map
1. **Assessment Platform** (`src/platform/assessment`): The core orchestration layer for all tests.
2. **Coding Platform** (`src/platform/coding`): Monaco IDE, remote code execution sandboxes.
3. **Contest Platform** (`src/platform/contest`): Live arenas, leaderboards.
4. **AI Platform** (`src/platform/ai`): Resume review, mock interviews, AI Tutor.

## Consequences
- **Positive**: High extensibility. Teams can work on the AI platform without breaking the core Assessment Platform.
- **Positive**: Strict API/Event contracts enforce stability.
- **Negative**: Increased boilerplate. All inter-domain communication must traverse explicitly defined `src/platform/contracts/` or fire asynchronous domain events.

## Enforcement
This ADR is strictly enforced by the PRR (Production Readiness Review) process. PRR-1 (Architecture Gate) will explicitly fail any PR containing cross-domain concrete dependency injection.

# NextHire Architecture Decision Records (ADR Index)

## Overview
This directory indexes the Architecture Decision Records (ADRs) capturing key architectural rationale, trade-offs, and design choices for the NextHire Enterprise Coding Platform.

---

## 📚 ADR Index

### [ADR-001: Relational Metadata Architecture over Comma-Separated Strings](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-001-relational-metadata.md)
- **Status**: Accepted (v1.0)
- **Context**: Storing problem tags as CSV strings or loose arrays caused query contamination, slow filters, and false positives.
- **Decision**: Adopt normalized SQL tables (`question_patterns`, `question_topics`, `question_companies`, `question_solutions`) with explicit indexes.
- **Consequence**: Ultra-fast indexed multi-filtering with 0 false positives.

---

### [ADR-002: Solution-Centric Approach Model](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-002-solution-centric-model.md)
- **Status**: Accepted (v1.0)
- **Context**: Assigning a single static pattern to a question failed to reflect problems with multiple valid approaches (e.g. *Trapping Rain Water*: Solution 1 Two Pointers $O(n)/O(1)$, Solution 2 Monotonic Stack $O(n)/O(n)$).
- **Decision**: Model `question_solutions` allowing N official approaches per problem with time/space complexities and multi-language code templates.
- **Consequence**: Provides comprehensive educational value comparable to LeetCode editorials.

---

### [ADR-003: Taxonomy Isolation: Topics vs. Solving Patterns vs. Subtopics](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-003-taxonomy-isolation.md)
- **Status**: Accepted (v1.0)
- **Context**: Mixing Data Structure topics (e.g., *Arrays*, *Trees*) with Algorithmic Solving Patterns (e.g., *Two Pointers*, *Sliding Window*) created confusion in student learning roadmaps.
- **Decision**: Enforce strict separation: 17+ Data Structure Topics, 100+ Subtopics, and 46+ Algorithmic Solving Patterns.
- **Consequence**: Enables clean NeetCode-style pattern roadmaps and domain deep-dives.

---

### [ADR-004: Interactive Directed Prerequisite Graph (DAG)](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-004-prerequisite-dag.md)
- **Status**: Accepted (v1.0)
- **Context**: Flat question lists lack structural learning order, overwhelming students.
- **Decision**: Model directed dependencies (`question_prerequisites`) creating prerequisite chains (*Fibonacci* $\rightarrow$ *Climbing Stairs* $\rightarrow$ *House Robber* $\rightarrow$ *Coin Change*).
- **Consequence**: Guided problem progression preventing students from jumping into Hard follow-ups prematurely.

---

### [ADR-005: In-Page AI Assistant Integration](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-005-inpage-ai-assistant.md)
- **Status**: Accepted (v1.0)
- **Context**: Students needed real-time hints, dry runs, and complexity analysis without navigating away from the workspace.
- **Decision**: Integrate multi-action AI assistant tabs (*Explain Hint*, *Dry Run Code*, *Analyze Complexity*, *Mock Interview*) with fallback handlers.
- **Consequence**: Increases student retention and reduces context-switching during practice.

---

### [ADR-006: Personalized Adaptive Recommendation Engine](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-006-recommendation-engine.md)
- **Status**: Accepted (v1.0)
- **Context**: Static problem lists do not adapt to individual student mastery or Elo ratings.
- **Decision**: Implement `codingRecommendationEngine.ts` mapping next optimal patterns, topics, and problem candidates based on recent solve history.
- **Consequence**: Provides a tailored learning pace for both campus placement candidates and FAANG interviewees.

---

### [ADR-007: Personalized Mastery Engine](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-007-mastery-engine.md)
- **Status**: Accepted (v1.0)
- **Context**: Students lacked visual feedback on topic strengths and weak areas.
- **Decision**: Build `codingMasteryEngine.ts` calculating topic-by-topic mastery percentages (`Arrays 90%`, `Graphs 40%`, `DP 20%`) with actionable advice.
- **Consequence**: Gives students a clear sense of progress and identifies areas needing reinforcement.

---

### [ADR-008: Event-Driven Async Messaging Strategy](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-008-event-driven-strategy.md)
- **Status**: Accepted (v2.0 Architecture Roadmap)
- **Context**: Synchronous cross-service calls create tight coupling and increase latency during code submission pipelines.
- **Decision**: Adopt asynchronous event publishing (`SubmissionCompleted` $\rightarrow$ `MasteryUpdated` $\rightarrow$ `RecommendationUpdated` $\rightarrow$ `AnalyticsLogged`).
- **Consequence**: Decouples domain services and ensures sub-millisecond API response times.

---

### [ADR-009: AI Gateway Abstraction & Fallback Isolation](file:///e:/PROJECTS/NextHire%20AI/my-app/docs/architecture/adr-009-ai-gateway-abstraction.md)
- **Status**: Accepted (v1.0)
- **Context**: Direct dependency on external LLM APIs created vulnerability during third-party service outages or API changes.
- **Decision**: Isolate AI calls behind a unified service gateway (`/api/chatbot`, `/api/ai-coach`) with prompt versioning and heuristic fallback modes.
- **Consequence**: Guarantees system availability and allows seamless switching between Groq, OpenAI, and local LLM execution.

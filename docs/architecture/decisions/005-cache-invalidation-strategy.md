# ADR-005: Granular Cache Invalidation Strategy

## Status
Accepted

## Context
To prevent redundant API calls to expensive LLM providers, caching is essential. However, resumes are highly mutable documents. If a user edits a single bullet point, discarding the entire cached `ResumeIntelligence` profile forces the user to wait (and us to pay) for a complete regeneration, which is highly inefficient.

## Decision
We will implement granular cache namespaces (`resume-parse`, `resume-intelligence`, `ats`, `jd-match`, `voice-context`) rather than a single monolithic cache block per resume. 

## Consequences
- **Pros:**
  - Only specific, invalidated workflows need to be re-run. If a user uploads a new Target JD, only the `jd-match` and `voice-context` caches are invalidated, while `resume-parse` and global `resume-intelligence` remain intact.
  - Massive reduction in token consumption and UI latency.
- **Cons:**
  - Increased complexity in cache management. Developers must carefully orchestrate cache invalidation chains (e.g., editing a bullet point MUST invalidate `ats` and `resume-intelligence`, but changing the target role only invalidates `jd-match`).
  - Cache staleness bugs are harder to debug.

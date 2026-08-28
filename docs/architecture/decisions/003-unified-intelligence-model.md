# ADR-003: Resume Intelligence as the Single Source of Truth

## Status
Accepted

## Context
A resume goes through various lifecycle events: parsing, ATS scoring, JD matching, bullet point optimization, cover letter generation, and mock voice interviews. Historically, each of these features was designed to take the raw Resume string and parse it individually, resulting in massive LLM token duplication, inconsistent formatting, and conflicting logic.

## Decision
We will force all downstream AI features to consume a unified `ResumeIntelligence` object instead of raw resume text.

## Consequences
- **Pros:**
  - **Drastic Cost Reduction:** Parsing only happens once.
  - **Speed:** Downstream engines (like JD Matcher or Voice Interviewer) execute significantly faster because they receive structured JSON context instead of raw, noisy text.
  - **Consistency:** An ATS score will always agree with the Career Coach because they are operating on the exact same parsed schema.
- **Cons:**
  - The `ResumeIntelligence` object becomes a massive, complex god-object.
  - If the initial parsing fails or hallucinates data, the error propagates strictly through all downstream features until the Intelligence object is manually refreshed.

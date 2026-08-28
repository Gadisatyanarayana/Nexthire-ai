# ADR-004: Capability-Based AI Provider Routing

## Status
Accepted

## Context
The LLM ecosystem is highly volatile. Gemini 1.5 Pro might be the best parser today, while Groq (Llama 3) might offer the lowest latency for rewriting bullet points, and OpenAI GPT-4o remains superior for multi-modal Voice reasoning. Hardcoding providers into business logic limits our agility and subjects the platform to complete failure during provider outages.

## Decision
We will route AI requests based on abstract **Capabilities** (e.g., `RESUME_PARSE`, `FAST_REWRITE`) through an `AIProviderRouter` rather than calling provider SDKs directly in the application service.

## Consequences
- **Pros:**
  - **Resilience:** If Gemini goes down, the router automatically fails over to OpenAI for `RESUME_PARSE` based on predefined fallback policies.
  - **Cost/Performance Tuning:** We can route repetitive, low-complexity tasks to cheap, fast models (Groq) and reserve expensive models (GPT-4o) for deep reasoning.
  - **Maintainability:** Adding a new LLM provider (e.g., Anthropic Claude 3.5 Sonnet) requires changing exactly one file (`AIProviderRouter.ts`) rather than refactoring dozens of service files.
- **Cons:**
  - Requires maintaining a strict, standardized interface for `AIProviderResponse` regardless of the underlying LLM's raw output format.

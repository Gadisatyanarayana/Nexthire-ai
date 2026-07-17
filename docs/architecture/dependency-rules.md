# Dependency Rules

This document specifies the strict architectural dependency constraints for NextHire AI. Violations of these rules will fail the build and validation gates.

---

## 1. Downward-Only Flow

Dependencies are strictly directional and hierarchical. A lower layer must never import or reference a higher layer.

```text
▲  [Client UI / Mobile]
│         │
│         ▼
│  [API Gateway]
│         │
│         ▼
│  [Bounded Contexts] (Learning, Assessment, Coding, Contest, AI, Voice)
│         │
│         ▼
│  [Platform Kernel]
▼  [Infrastructure]
```

---

## 2. Bounded Context Isolation

1. **No Direct Import Crossings**: `src/platform/learning` must never import from `src/platform/assessment` or any other sibling domain.
2. **Contract-Based Communication**: If Domain A needs to interact with Domain B, it must do so asynchronously via the central Event Bus (`PlatformEvent`) or synchronously via public interface contracts defined in `src/platform/contracts/`.
3. **No Database Share**: Domains must never query database tables owned by another domain. All cross-domain data collection must go through defined queries/commands or materialized read-only views synced via the Event Bus.

---

## 3. Infrastructure Separation

1. **Kernel/Domain Purity**: Domain models and aggregates in `src/platform/<domain>/domain` must be pure TypeScript/JavaScript. They must have zero dependencies on libraries like `redis`, `@supabase/supabase-js`, `dockerode`, `openai`, or `next/server`.
2. **Infrastructure Adapters**: All external database drivers, API clients, and execution runtimes live in `src/infrastructure/` and implement interfaces defined in `contracts/`.

# Platform Kernel

The Platform Kernel contains shared primitives, base contracts, and domain-agnostic patterns that all bounded contexts may depend upon.

---

## 1. Kernel Components

```text
src/platform/kernel/
├── ids/             # UUID/KSUID generation rules
├── clock/           # Monotonic clocks for test time-freezing
├── events/          # Unified Event Bus definitions
├── policies/        # Base policy classes & checks
├── validation/      # Global input/schema validators
└── telemetry/       # Metrics, logs, traces, cost trackers
```

---

## 2. Event Bus Design

All domain events are published via an transactional outbox pattern to ensure message durability and strict delivery consistency.

```text
[State Change] ➔ [Atomically write Outbox event to DB]
                        │
                  (Async Outbox Worker)
                        │
                        ▼
             [Central Dispatcher]
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       [Sub 1]       [Sub 2]     [Sub 3]
```

### Event Format Specification
Every event envelope is standardized as follows:
```typescript
export interface PlatformEvent<TPayload = any> {
  eventId: string;
  eventType: string; // e.g. "CodingSubmitted.v1"
  timestamp: string;
  tenantId: string;
  payload: TPayload;
}
```

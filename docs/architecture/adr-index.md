# Architecture Decision Records (ADR) Index

This index tracks the major architectural decisions made during the evolution of NextHire AI, from a monolith prototype into an enterprise SaaS platform.

| ADR | Decision | Context |
| :--- | :--- | :--- |
| **ADR-001** | [Adopt Domain-Driven Bounded Contexts](./adr/001-bounded-contexts.md) | Enforced modularity for Learning, Assessment, Coding, and Admin. |
| **ADR-002** | [Event-Driven Communication via Outbox](./adr/002-transactional-outbox.md) | Prevented cross-domain coupling and guaranteed reliable event delivery. |
| **ADR-003** | [PBAC replaces RBAC](./adr/003-pbac.md) | Introduced Policy-Based Access Control for granular, scalable permissions. |
| **ADR-004** | [Hybrid Outbox + Redis Webhook Delivery](./adr/004-hybrid-webhooks.md) | Decoupled webhook dispatching from core transactions to prevent event loss. |
| **ADR-005** | [Multi-Deployment Tenancy (Pool/Bridge/Silo)](./adr/005-deployment-modes.md) | Allowed flexible isolation strategies for compliance without codebase branching. |
| **ADR-006** | [BillingProvider Abstraction](./adr/006-billing-provider.md) | Decoupled the platform from Stripe to support future payment gateways. |
| **ADR-007** | [TenantContext Request Resolution](./adr/007-tenant-context.md) | Introduced a singleton value object resolved via SaaS Gateway middleware. |

*Note: Detailed ADR documents are located in the `docs/architecture/adr/` directory.*

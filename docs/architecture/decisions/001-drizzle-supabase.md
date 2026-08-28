# ADR-001: Use Drizzle ORM over Prisma for Supabase Integration

## Status
Accepted

## Context
NextHire AI heavily relies on Supabase for its backend database, authentication, and realtime features. We need an ORM to interact with the PostgreSQL database securely and efficiently from our Next.js edge functions and API routes. The standard choices in the ecosystem are Prisma and Drizzle ORM.

## Decision
We will use **Drizzle ORM** alongside `postgres.js` to connect to Supabase PostgreSQL, instead of Prisma.

## Consequences
- **Pros:**
  - Native PostgreSQL support with zero abstraction overhead.
  - Generates highly optimized SQL, which is significantly faster and more memory-efficient than Prisma’s Rust engine (critical for edge compatibility).
  - Better type inference without needing a heavy generated client.
  - Integrates smoothly with existing Supabase Auth mechanisms.
- **Cons:**
  - Steeper learning curve for developers accustomed to Prisma's schema language (Drizzle uses TypeScript to define schemas).
  - Requires writing slightly more verbose SQL-like syntax for complex joins.

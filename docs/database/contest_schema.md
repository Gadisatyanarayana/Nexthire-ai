# Contest Engine Database Schema (Frozen)

This document represents the absolute source of truth for the Enterprise Live Contest Platform schema.

## Storage Separation Strategy
- **Transactional Data**: PostgreSQL (Contests, Registrations, Leaderboard Snapshots)
- **Object Storage**: S3/R2 (Contest Replays, MOSS Plagiarism Reports)
- **Live State**: Redis (Active Leaderboards, Clarification Queues)

## Table Definitions

### `contests` (Aggregate Root)
- `id`: UUID (PK)
- `tenant_id`: UUID (Index)
- `title`: String
- `state`: Enum (DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, ARCHIVED)
- `start_time`: Timestamp (UTC)
- `end_time`: Timestamp (UTC)
- `blueprint_id`: UUID
- `current_version`: Integer
- `created_at`: Timestamp

### `contest_versions` (Immutable)
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `version`: Integer
- `scoring_policy_id`: UUID
- `rating_policy_id`: UUID
- `freeze_policy_id`: UUID
- `published_at`: Timestamp

### `contest_snapshots` (Reproducible Context)
- `id`: UUID (PK)
- `contest_version_id`: UUID (FK)
- `problem_version_ids`: UUID[]
- `integrity_hash`: String (SHA-256)

### `contest_registrations`
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `user_id`: UUID
- `team_id`: UUID (Optional)
- `status`: Enum (PENDING, APPROVED, REJECTED)
- `registered_at`: Timestamp

### `contest_participants`
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `user_id`: UUID
- `access_granted_at`: Timestamp
*Indexes*: `contest_id`, `user_id`

### `contest_announcements`
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `type`: Enum (IMMEDIATE, SCHEDULED, PINNED, TARGETED)
- `message_md`: Text
- `broadcast_at`: Timestamp

### `contest_clarifications`
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `user_id`: UUID
- `question`: Text
- `response`: Text
- `status`: Enum (PENDING, ANSWERED, REJECTED, BROADCAST)

### `contest_leaderboards` (CQRS Projection)
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `user_id`: UUID
- `score`: Integer
- `penalty`: Integer
- `rank`: Integer
- `snapshot_at`: Timestamp

### `contest_ratings`
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `user_id`: UUID
- `previous_rating`: Integer
- `new_rating`: Integer
- `volatility`: Float

### `contest_audit_log`
- `id`: UUID (PK)
- `contest_id`: UUID (FK)
- `action`: String (e.g. "PAUSED", "REJUDGE_TRIGGERED")
- `actor_id`: UUID
- `timestamp`: Timestamp (UTC)

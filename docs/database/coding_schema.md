# Coding Engine Database Schema (Frozen)

This document defines the 9 core tables for the Enterprise Coding Platform schema.

## Storage Separation Strategy
- **Transactional Data**: PostgreSQL (Problems, Submissions, Editorials)
- **Object Storage**: S3/R2 (Compiled Executables, Execution Logs, Video Editorials)
- **Caching**: Redis (Leaderboards, Active Queues)

## Table Definitions

### 1. `coding_problems`
An Aggregate Root defining the problem statement and constraints.
- `id`: UUID (PK)
- `tenant_id`: UUID (Index)
- `current_version_id`: UUID (FK to `coding_problem_versions`)
- `difficulty`: Enum (EASY, MEDIUM, HARD)
- `topics`: String[]
- `companies`: String[]
- `created_at`: Timestamp
- `updated_at`: Timestamp
*Indexes*: `tenant_id`, `difficulty`, `topics`

### 2. `coding_problem_versions`
Immutable snapshot of a problem for historical integrity.
- `id`: UUID (PK)
- `problem_id`: UUID (FK)
- `version`: Integer
- `title`: String
- `statement_md`: Text
- `constraints`: JSONB
- `execution_profile_id`: UUID
- `published_at`: Timestamp

### 3. `coding_test_cases`
- `id`: UUID (PK)
- `problem_version_id`: UUID (FK)
- `type`: Enum (SAMPLE, HIDDEN, STRESS)
- `input_data`: Text
- `expected_output`: Text
- `points`: Integer
- `is_active`: Boolean
*Indexes*: `problem_version_id`

### 4. `coding_submissions`
- `id`: UUID (PK)
- `tenant_id`: UUID
- `user_id`: UUID
- `problem_version_id`: UUID (FK)
- `context_type`: Enum (NORMAL, CONTEST, ASSESSMENT, PRACTICE)
- `context_id`: UUID
- `language`: String
- `status`: Enum (PENDING, COMPILING, EXECUTING, JUDGING, COMPLETED, FAILED, CANCELLED)
- `verdict`: Enum (AC, WA, TLE, MLE, RTE, CE, PE, OLE, SECURITY_VIOLATION, SANDBOX_FAILURE, JUDGE_FAILURE)
- `runtime_ms`: Integer
- `memory_kb`: Integer
- `created_at`: Timestamp
*Partitioning*: By `created_at` (Monthly partitions for scale)
*Indexes*: `user_id`, `problem_version_id`, `status`, `context_id`

### 5. `coding_execution_artifacts`
Tracks pointers to the Object Storage layer.
- `id`: UUID (PK)
- `submission_id`: UUID (FK)
- `artifact_type`: Enum (SOURCE_CODE, COMPILER_LOG, EXECUTABLE, RUNTIME_STDOUT, RUNTIME_STDERR, MEMORY_TRACE)
- `storage_uri`: String (S3/R2 path)
- `expires_at`: Timestamp (Auto-cleanup for executables)
*Indexes*: `submission_id`

### 6. `coding_languages`
Registry of supported languages.
- `id`: String (PK) (e.g. 'python-3.11')
- `name`: String
- `capabilities`: JSONB
- `sandbox_provider`: String

### 7. `coding_editorials`
- `id`: UUID (PK)
- `problem_id`: UUID (FK)
- `content_md`: Text
- `video_uri`: String (S3/R2 path)
- `ai_tutor_enabled`: Boolean

### 8. `coding_discussions`
- `id`: UUID (PK)
- `problem_id`: UUID (FK)
- `user_id`: UUID
- `content`: Text
- `created_at`: Timestamp

### 9. `coding_leaderboards`
- `id`: UUID (PK)
- `tenant_id`: UUID
- `context_type`: Enum (CONTEST, OVERALL)
- `context_id`: UUID
- `user_id`: UUID
- `score`: Integer
- `rank`: Integer
- `solved_count`: Integer
- `last_solved_at`: Timestamp
*Indexes*: `context_id`, `score DESC`

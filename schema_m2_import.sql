-- NextHire AI - Milestone 2 Import Engine & Versioning Schema
-- Adds Isolated Staging, Batch Management, and Immutable Versioning

-- 1. Import Batches
create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  uploaded_by text not null,
  status text not null check (status in ('Queued', 'Processing', 'ValidationFailed', 'AwaitingApproval', 'Publishing', 'Completed', 'RolledBack')),
  total_rows integer default 0,
  inserted_rows integer default 0,
  skipped_rows integer default 0,
  failed_rows integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 2. Platform Questions Staging (Isolated Environment)
-- Mirrors platform_questions but holds data before publication
create table if not exists platform_questions_staging (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references import_batches(id) on delete cascade,
  domain_id text references platform_domains(id),
  module_id text references platform_modules(id),
  lesson_id text references platform_lessons(id),
  concept_id text, -- nullable if auto-generated
  title text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  bloom_level text not null check (bloom_level in ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
  company_tags jsonb default '[]'::jsonb,
  validation_status text default 'Pending' check (validation_status in ('Pending', 'Valid', 'Invalid')),
  validation_errors jsonb default '[]'::jsonb,
  raw_payload jsonb not null, -- Stores the entire imported row for debugging/DLQ
  created_at timestamp default now()
);

-- 3. Batch Items (Junction for Rollbacks on Production)
create table if not exists batch_items (
  batch_id uuid references import_batches(id) on delete cascade,
  question_id uuid references platform_questions(id) on delete cascade,
  created_at timestamp default now(),
  primary key (batch_id, question_id)
);

-- 4. Immutable Question Versions
create table if not exists platform_questions_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references platform_questions(id) on delete cascade,
  version_number integer not null,
  content jsonb not null, -- Stores the full state of the question at this version
  created_by text not null,
  created_at timestamp default now(),
  unique(question_id, version_number)
);

-- Update platform_questions to track current version
alter table platform_questions add column if not exists current_version_id uuid references platform_questions_versions(id);
alter table platform_questions add column if not exists status text default 'Draft' check (status in ('Draft', 'ReadyForReview', 'ReviewerApproved', 'Published', 'Deprecated', 'Archived'));
alter table platform_questions add column if not exists import_batch_id uuid references import_batches(id) on delete set null;

-- Enable RLS (To be expanded in CMS Phase)
alter table import_batches enable row level security;
alter table platform_questions_staging enable row level security;
alter table batch_items enable row level security;
alter table platform_questions_versions enable row level security;

-- Logical Reasoning Database Schema (Phase D)
-- Consistent isolation prefix: reasoning_

-- Reasoning Modules
create table if not exists reasoning_modules (
  id text primary key,
  title text not null,
  level_order integer not null,
  parent_id text,
  child_ids text[],
  required_dependencies text[],
  recommended_dependencies text[],
  created_at timestamp default now()
);

-- Reasoning Lessons (Topics)
create table if not exists reasoning_lessons (
  id text primary key,
  module_id text references reasoning_modules(id) on delete cascade,
  title text not null,
  difficulty text not null,
  reading_time text,
  content jsonb,
  status text default 'draft',
  parent_id text,
  child_ids text[],
  required_dependencies text[],
  recommended_dependencies text[],
  concepts_learned text[],
  concepts_required_next text[],
  module_milestone boolean default false,
  created_at timestamp default now()
);

-- Reasoning Formulas / Key Concepts
create table if not exists reasoning_formulas (
  id uuid primary key default gen_random_uuid(),
  topic_id text references reasoning_lessons(id) on delete cascade,
  formula_text text not null,
  example_q text,
  example_a text,
  status text default 'draft'
);

-- Reasoning Questions
create table if not exists reasoning_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text references reasoning_lessons(id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_index integer not null,
  explanation text not null,
  difficulty text not null,
  status text default 'draft',
  created_at timestamp default now()
);

-- Reasoning Companies
create table if not exists reasoning_companies (
  id text primary key,
  name text not null,
  tier text,
  logo_url text,
  description text
);

-- Reasoning Company Tags
create table if not exists reasoning_company_tags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references reasoning_questions(id) on delete cascade,
  company_name text not null,
  year integer,
  frequency integer default 1
);

-- Reasoning Mock Sessions
create table if not exists reasoning_mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  start_time timestamp default now(),
  end_time timestamp,
  score integer default 0,
  session_data jsonb not null default '{}'::jsonb
);

-- Reasoning Topic Mastery (Analytics)
create table if not exists reasoning_topic_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  topic_id text references reasoning_lessons(id) on delete cascade,
  mastery_score integer not null default 0,
  mastery_level text default 'Not Started',
  questions_attempted integer not null default 0,
  questions_correct integer not null default 0,
  streak_days integer not null default 0,
  confidence_score integer not null default 50,
  last_attempt_date timestamp,
  last_reviewed_at timestamp,
  revision_queue_date timestamp,
  unique(user_id, topic_id)
);

-- Reasoning Question Attempts
create table if not exists reasoning_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  is_correct boolean not null,
  time_taken_ms integer,
  difficulty text,
  topic_id text references reasoning_lessons(id) on delete cascade,
  attempted_at timestamp default now()
);

-- Reasoning Revision Queue
create table if not exists reasoning_revision_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  next_review_date timestamp not null,
  interval_days integer not null default 1,
  ease_factor real not null default 2.5,
  created_at timestamp default now(),
  unique(user_id, question_id)
);

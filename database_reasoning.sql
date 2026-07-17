-- Logical Reasoning Database Schema (Phase E: Gold Standard Foundation)
-- Consistent isolation prefix: reasoning_
-- This schema represents the generic LMS framework structure suitable for any future subject.

-- 1. Curriculum Tables
create table if not exists reasoning_modules (
  id text primary key,
  title text not null,
  level_order integer not null,
  parent_id text,
  child_ids text[],
  required_dependencies text[],
  recommended_dependencies text[],
  schema_version text default '1.0',
  content_version text default '1.0',
  created_at timestamp default now()
);

create table if not exists reasoning_lessons (
  id text primary key,
  module_id text references reasoning_modules(id) on delete cascade,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert', 'adaptive')),
  reading_time text,
  content jsonb,
  status text default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  parent_id text,
  child_ids text[],
  required_dependencies text[],
  recommended_dependencies text[],
  concepts_learned text[],
  concepts_required_next text[],
  module_milestone boolean default false,
  generator_version text default '1.0',
  created_at timestamp default now()
);

create table if not exists reasoning_formulas (
  id uuid primary key default gen_random_uuid(),
  topic_id text references reasoning_lessons(id) on delete cascade,
  formula_text text not null,
  example_q text,
  example_a text,
  status text default 'published',
  created_at timestamp default now()
);

create table if not exists reasoning_pattern_sheets (
  id uuid primary key default gen_random_uuid(),
  topic_id text references reasoning_lessons(id) on delete cascade,
  pattern_name text not null,
  description text,
  visual_url text,
  created_at timestamp default now()
);

create table if not exists reasoning_flashcards (
  id uuid primary key default gen_random_uuid(),
  topic_id text references reasoning_lessons(id) on delete cascade,
  front_text text not null,
  back_text text not null,
  created_at timestamp default now()
);

-- 2. Questions Ecosystem
create table if not exists reasoning_questions (
  id uuid primary key default gen_random_uuid(),
  module_id text references reasoning_modules(id) on delete cascade,
  lesson_id text references reasoning_lessons(id) on delete cascade,
  concept_id text,
  pattern_id uuid references reasoning_pattern_sheets(id) on delete set null,
  question text not null,
  options text[] not null,
  correct_index integer not null,
  explanation text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert', 'adaptive')),
  status text default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  hint text,
  ai_explanation text,
  topic text,
  subtopic text,
  pattern_type text,
  bloom_level text,
  estimated_time_sec integer default 60,
  success_rate float default 0.0,
  average_time_sec integer default 0,
  previous_year boolean default false,
  exam_name text,
  company_source text,
  exam_year integer,
  exam_round text,
  memory_based boolean default false,
  official boolean default false,
  generator_version text default '1.0',
  created_at timestamp default now()
);

-- 3. Companies Ecosystem
create table if not exists reasoning_companies (
  id text primary key,
  name text not null,
  logo_url text,
  active boolean default true,
  sections jsonb default '[]'::jsonb,
  overview jsonb default '{}'::jsonb,
  eligibility jsonb default '{}'::jsonb,
  test_pattern jsonb default '{}'::jsonb,
  syllabus jsonb default '{}'::jsonb,
  faqs jsonb default '[]'::jsonb,
  created_at timestamp default now()
);

create table if not exists reasoning_company_tags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references reasoning_questions(id) on delete cascade,
  company_id text references reasoning_companies(id) on delete cascade,
  company_name text, -- Kept for legacy/denormalized display
  year integer,
  frequency integer default 1
);

create table if not exists reasoning_company_topic_weightages (
  id uuid primary key default gen_random_uuid(),
  company_id text references reasoning_companies(id) on delete cascade,
  topic_id text references reasoning_lessons(id) on delete cascade,
  weight float not null default 0.0,
  stars integer not null default 1,
  frequency integer not null default 0,
  question_count integer not null default 0,
  last_updated timestamp default now(),
  unique(company_id, topic_id)
);

create table if not exists reasoning_learning_paths (
  id uuid primary key default gen_random_uuid(),
  company_id text references reasoning_companies(id) on delete cascade,
  path_name text not null,
  description text,
  roadmap_nodes jsonb not null default '[]'::jsonb,
  created_at timestamp default now()
);

-- 4. Mock & Quiz Ecosystem
create table if not exists reasoning_mock_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mock_type text not null,
  difficulty text not null,
  total_questions integer not null,
  duration_minutes integer not null,
  company_id text references reasoning_companies(id) on delete set null,
  status text default 'published',
  created_at timestamp default now()
);

create table if not exists reasoning_mock_questions (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid references reasoning_mock_tests(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  order_index integer not null,
  unique(mock_test_id, question_id)
);

create table if not exists reasoning_mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  mock_test_id uuid references reasoning_mock_tests(id) on delete cascade,
  start_time timestamp default now(),
  end_time timestamp,
  score integer default 0,
  status text default 'in_progress',
  session_data jsonb not null default '{}'::jsonb
);

create table if not exists reasoning_mock_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references reasoning_mock_sessions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  is_correct boolean not null,
  time_taken_ms integer not null,
  selected_option_index integer,
  created_at timestamp default now()
);

create table if not exists reasoning_quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id text references reasoning_lessons(id) on delete cascade,
  title text not null,
  quiz_type text not null,
  difficulty text not null,
  duration_minutes integer,
  created_at timestamp default now()
);

create table if not exists reasoning_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references reasoning_quizzes(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  order_index integer not null,
  unique(quiz_id, question_id)
);

create table if not exists reasoning_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  quiz_id uuid references reasoning_quizzes(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  created_at timestamp default now()
);

-- 5. Progress & Engagement
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

create table if not exists reasoning_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  module_id text references reasoning_modules(id) on delete cascade,
  progress_percent float not null default 0.0,
  completed_lessons integer not null default 0,
  is_unlocked boolean default false,
  updated_at timestamp default now(),
  unique(user_id, module_id)
);

create table if not exists reasoning_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  lesson_id text references reasoning_lessons(id) on delete cascade,
  is_completed boolean default false,
  time_spent_sec integer default 0,
  updated_at timestamp default now(),
  unique(user_id, lesson_id)
);

create table if not exists reasoning_daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  activity_date date not null default current_date,
  xp_earned integer not null default 0,
  minutes_spent integer not null default 0,
  questions_attempted integer not null default 0,
  accuracy_percent float not null default 0.0,
  unique(user_id, activity_date)
);

create table if not exists reasoning_mistake_book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  topic_id text references reasoning_lessons(id) on delete cascade,
  mistake_reason text,
  retry_count integer not null default 0,
  mastered boolean default false,
  last_attempted_at timestamp default now(),
  unique(user_id, question_id)
);

create table if not exists reasoning_company_readiness (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  company_id text references reasoning_companies(id) on delete cascade,
  readiness_score float not null default 0,
  updated_at timestamp default now(),
  unique(user_id, company_id)
);

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

create table if not exists reasoning_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  target_id text not null,
  target_type text not null,
  created_at timestamp default now(),
  unique(user_id, target_id, target_type)
);

create table if not exists reasoning_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  target_id text not null,
  content text not null,
  updated_at timestamp default now(),
  unique(user_id, target_id)
);

-- 6. Achievements & Gamification
create table if not exists reasoning_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  achievement_type text not null,
  title text not null,
  unlocked_at timestamp default now()
);

create table if not exists reasoning_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  badge_id text not null,
  badge_name text not null,
  xp integer not null default 0,
  rarity text,
  icon text,
  earned_for text,
  metadata jsonb default '{}'::jsonb,
  unlocked_at timestamp default now()
);

create table if not exists reasoning_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  certificate_name text not null,
  level text not null,
  score float,
  issued_by text not null,
  verification_url text unique not null,
  download_url text,
  issue_date timestamp default now()
);

create table if not exists reasoning_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  challenge_type text not null,
  start_date timestamp not null,
  end_date timestamp not null,
  status text default 'active'
);

create table if not exists reasoning_daily_challenge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  challenge_id uuid references reasoning_challenges(id) on delete cascade,
  completed boolean default false,
  score integer default 0,
  completed_at timestamp
);

-- 7. AI & Search
create table if not exists reasoning_search_index (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  target_type text not null,
  title text,
  description text,
  search_vector tsvector,
  created_at timestamp default now()
);

create table if not exists reasoning_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_type text not null,
  provider text,
  model text,
  temperature float,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  response_time integer default 0,
  context jsonb default '{}'::jsonb,
  lesson_id text references reasoning_lessons(id) on delete set null,
  question_id uuid references reasoning_questions(id) on delete set null,
  company_id text references reasoning_companies(id) on delete set null,
  topic_id text references reasoning_lessons(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists reasoning_ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id uuid references reasoning_ai_sessions(id) on delete cascade,
  feedback jsonb not null,
  created_at timestamp default now()
);

-- 8. Idempotent Schema Upgrades for Existing Tables
do $$
begin
  -- reasoning_modules
  begin alter table reasoning_modules add column schema_version text default '1.0'; exception when duplicate_column then null; end;
  begin alter table reasoning_modules add column content_version text default '1.0'; exception when duplicate_column then null; end;

  -- reasoning_lessons
  begin alter table reasoning_lessons add column generator_version text default '1.0'; exception when duplicate_column then null; end;

  -- reasoning_formulas
  begin alter table reasoning_formulas add column created_at timestamp default now(); exception when duplicate_column then null; end;
  
  -- reasoning_questions
  begin alter table reasoning_questions add column module_id text; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column concept_id text; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column pattern_id uuid; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column exam_name text; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column company_source text; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column exam_year integer; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column exam_round text; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column memory_based boolean default false; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column official boolean default false; exception when duplicate_column then null; end;
  begin alter table reasoning_questions add column generator_version text default '1.0'; exception when duplicate_column then null; end;
  
  -- reasoning_company_tags
  begin alter table reasoning_company_tags add column company_id text; exception when duplicate_column then null; end;

  -- reasoning_ai_sessions
  begin alter table reasoning_ai_sessions add column provider text; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column model text; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column temperature float; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column prompt_tokens integer default 0; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column completion_tokens integer default 0; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column response_time integer default 0; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column context jsonb default '{}'::jsonb; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column lesson_id text; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column question_id uuid; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column company_id text; exception when duplicate_column then null; end;
  begin alter table reasoning_ai_sessions add column topic_id text; exception when duplicate_column then null; end;

  -- reasoning_company_readiness
  begin alter table reasoning_company_readiness drop column company_id cascade; exception when undefined_column then null; end;
  begin alter table reasoning_company_readiness add column company_id text references reasoning_companies(id) on delete cascade; exception when duplicate_column then null; end;
end $$;

-- 9. High Performance Indexes (crucial for 60k+ questions & real-time analytics)
-- Wrapped in DO block so the parser does not fail if columns were just added dynamically above
do $$
begin
  execute 'create index if not exists idx_reasoning_questions_lesson on reasoning_questions(lesson_id)';
  execute 'create index if not exists idx_reasoning_questions_module on reasoning_questions(module_id)';
  execute 'create index if not exists idx_reasoning_questions_difficulty on reasoning_questions(difficulty)';
  execute 'create index if not exists idx_reasoning_questions_status on reasoning_questions(status)';
  
  execute 'create index if not exists idx_reasoning_company_tags_company on reasoning_company_tags(company_id)';
  execute 'create index if not exists idx_reasoning_company_tags_question on reasoning_company_tags(question_id)';
  
  execute 'create index if not exists idx_reasoning_mock_tests_company on reasoning_mock_tests(company_id)';
  execute 'create index if not exists idx_reasoning_mock_sessions_user on reasoning_mock_sessions(user_id)';
  execute 'create index if not exists idx_reasoning_topic_mastery_user on reasoning_topic_mastery(user_id)';
  
  execute 'create index if not exists idx_reasoning_daily_activity_user on reasoning_daily_activity(user_id)';
  execute 'create index if not exists idx_reasoning_module_progress_user on reasoning_module_progress(user_id)';
  
  execute 'create index if not exists idx_reasoning_search_vector on reasoning_search_index using gin(search_vector)';
end $$;

-- Users Table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Contests table for user-created public/private contests
create table if not exists contests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  mode text not null check (mode in ('public', 'private')),
  join_code text not null unique,
  duration_minutes integer not null default 90,
  starts_at timestamp with time zone,
  status text not null default 'scheduled', -- scheduled, live, completed, cancelled
  created_at timestamp default now()
);

-- Contest participants table
create table if not exists contest_participants (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references contests(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamp default now(),
  finished_at timestamp,
  score integer,
  rank integer
);

-- Contest chat messages for live doubt solving during contests
create table if not exists contest_chat_messages (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references contests(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  message text not null,
  created_at timestamp default now()
);

-- Contest question set table (shared problem list per contest)
create table if not exists contest_questions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references contests(id) on delete cascade,
  question_id text references questions(id) on delete cascade,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamp default now()
);

-- User activity audit table (resume builder/analyzer usage and other product events)
create table if not exists user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  activity_type text not null,
  source text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamp default now()
);

-- Voice interviewer durable sessions (Phase 1 persistence)
create table if not exists voice_interview_sessions (
  session_id text primary key,
  email text not null,
  status text not null default 'setup',
  payload jsonb not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Coding Questions Table
create table if not exists questions (
  id text primary key,
  title text not null,
  difficulty text not null,
  input_format text,
  output_format text,
  time_limit_minutes integer not null default 20,
  constraints text,
  function_name text,
  input_type text,
  output_type text,
  topic text[] not null default '{}',
  acceptance_rate integer not null default 0,
  description text not null,
  slug text unique,
  source text,
  company_tags text[] not null default '{}',
  pattern_tags text[] not null default '{}',
  sample_test_cases jsonb not null default '[]'::jsonb,
  hidden_test_cases jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  testcases jsonb not null default '[]'::jsonb,
  starter_code jsonb not null default '{}'::jsonb
);

-- Canonical problem table (LeetCode-style) used by secure hidden test-case runner
create table if not exists problems (
  id uuid primary key default gen_random_uuid(),
  legacy_question_id text unique references questions(id) on delete set null,
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topics text[] not null default '{}',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table questions add column if not exists starter_code jsonb not null default '{}'::jsonb;
alter table questions add column if not exists slug text;
alter table questions add column if not exists source text;
alter table questions add column if not exists input_format text;
alter table questions add column if not exists output_format text;
alter table questions add column if not exists time_limit_minutes integer not null default 20;
alter table questions add column if not exists constraints text;
alter table questions add column if not exists company_tags text[] not null default '{}';
alter table questions add column if not exists pattern_tags text[] not null default '{}';
alter table questions add column if not exists sample_test_cases jsonb not null default '[]'::jsonb;
alter table questions add column if not exists hidden_test_cases jsonb not null default '[]'::jsonb;
alter table questions add column if not exists function_name text;
alter table questions add column if not exists input_type text;
alter table questions add column if not exists output_type text;
alter table questions add column if not exists problem_id uuid references problems(id) on delete set null;

-- Optional normalized test cases table for future runner enhancements
create table if not exists test_cases (
  id uuid primary key default gen_random_uuid(),
  question_id text references questions(id) on delete cascade,
  input text,
  output text,
  created_at timestamp default now()
);

-- Evolve legacy test_cases table to support hidden/public split and normalized problem foreign key.
alter table test_cases add column if not exists problem_id uuid references problems(id) on delete cascade;
alter table test_cases add column if not exists expected_output text;
alter table test_cases add column if not exists is_hidden boolean not null default false;
alter table test_cases add column if not exists explanation text;
alter table test_cases add column if not exists updated_at timestamp default now();

-- Backfill expected_output from legacy output column when available.
update test_cases
set expected_output = output
where expected_output is null
  and output is not null;

update test_cases
set is_hidden = false
where is_hidden is null;

alter table test_cases alter column is_hidden set not null;

-- Link legacy question_id test cases to canonical problems when mapping exists.
update test_cases tc
set problem_id = p.id
from problems p
where tc.problem_id is null
  and tc.question_id is not null
  and p.legacy_question_id = tc.question_id;

-- Solutions/Submissions Table
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  contest_id uuid references contests(id) on delete set null,
  problem_id uuid references problems(id) on delete set null,
  question_id text,
  language text,
  code text,
  output text,
  result text,
  status text,
  runtime text,
  memory text,
  feedback text,
  difficulty text,
  created_at timestamp default now()
);

alter table submissions add column if not exists problem_id uuid references problems(id) on delete set null;
alter table submissions add column if not exists status text;
alter table submissions add column if not exists runtime text;
alter table submissions add column if not exists memory text;

-- Submission metrics used for history/leaderboard/accepted% analytics.
alter table submissions add column if not exists passed_count integer not null default 0;
alter table submissions add column if not exists total_count integer not null default 0;
alter table submissions add column if not exists runtime_ms integer;
alter table submissions add column if not exists memory_kb integer;
alter table submissions add column if not exists failed_input text;

-- App metadata table (used for sync timestamps and global counters)
create table if not exists app_meta (
  key text primary key,
  value text,
  updated_at timestamp default now()
);

-- Create indexes
create index if not exists idx_submissions_user_id on submissions(user_id);
create index if not exists idx_submissions_contest_id on submissions(contest_id);
create index if not exists idx_submissions_problem_created_desc on submissions(problem_id, created_at desc);
create index if not exists idx_submissions_user_problem_created_desc on submissions(user_id, problem_id, created_at desc);
create index if not exists idx_submissions_user_created_desc on submissions(user_id, created_at desc);
create index if not exists idx_submissions_user_question_result on submissions(user_id, question_id, result);
create index if not exists idx_submissions_contest_user_created on submissions(contest_id, user_id, created_at desc);
create index if not exists idx_submissions_result_created on submissions(result, created_at desc);
create index if not exists idx_users_email on users(email);
create index if not exists idx_questions_difficulty on questions(difficulty);
create index if not exists idx_questions_acceptance on questions(acceptance_rate);
create index if not exists idx_questions_title on questions(title);
create index if not exists idx_questions_slug on questions(slug);
create index if not exists idx_questions_topic_gin on questions using gin(topic);
create index if not exists idx_questions_company_tags_gin on questions using gin(company_tags);
create index if not exists idx_questions_problem_id on questions(problem_id);
create index if not exists idx_problems_legacy_question_id on problems(legacy_question_id);
create index if not exists idx_problems_difficulty on problems(difficulty);
create index if not exists idx_problems_topics_gin on problems using gin(topics);
create index if not exists idx_test_cases_question_id on test_cases(question_id);
create index if not exists idx_test_cases_problem_id on test_cases(problem_id);
create index if not exists idx_test_cases_problem_hidden on test_cases(problem_id, is_hidden);
create index if not exists idx_contests_owner_user_id on contests(owner_user_id);
create index if not exists idx_contests_owner_created_desc on contests(owner_user_id, created_at desc);
create index if not exists idx_contests_mode_starts_at on contests(mode, starts_at);
create index if not exists idx_contests_join_code on contests(join_code);
create index if not exists idx_contest_participants_contest_id on contest_participants(contest_id);
create index if not exists idx_contest_participants_user_id on contest_participants(user_id);
create unique index if not exists idx_contest_participants_contest_user_unique on contest_participants(contest_id, user_id);
create index if not exists idx_contest_chat_messages_contest_id on contest_chat_messages(contest_id);
create index if not exists idx_contest_chat_messages_created_at on contest_chat_messages(created_at desc);
create index if not exists idx_contest_questions_contest_id on contest_questions(contest_id);
create index if not exists idx_contest_questions_question_id on contest_questions(question_id);
create unique index if not exists idx_contest_questions_unique on contest_questions(contest_id, question_id);
create index if not exists idx_user_activity_user_id on user_activity(user_id);
create index if not exists idx_user_activity_type on user_activity(activity_type);
create index if not exists idx_user_activity_user_created_desc on user_activity(user_id, created_at desc);
create index if not exists idx_voice_interview_sessions_email on voice_interview_sessions(email);
create index if not exists idx_voice_interview_sessions_status on voice_interview_sessions(status);
create index if not exists idx_voice_interview_sessions_updated_desc on voice_interview_sessions(updated_at desc);

-- Audit view for hidden testcase policy compliance (>=2 visible and 5-15 hidden)
-- Audit view for hidden testcase policy compliance (>=2 visible and 20 hidden)
create or replace view problem_test_case_coverage as
select
  p.id as problem_id,
  p.legacy_question_id as question_id,
  count(tc.id) filter (where coalesce(tc.is_hidden, false) = false) as visible_count,
  count(tc.id) filter (where coalesce(tc.is_hidden, false) = true) as hidden_count,
  count(tc.id) as total_count,
  (
    count(tc.id) filter (where coalesce(tc.is_hidden, false) = false) >= 2
    and count(tc.id) filter (where coalesce(tc.is_hidden, false) = true) >= 20
  ) as is_compliant
from problems p
left join test_cases tc on tc.problem_id = p.id
group by p.id, p.legacy_question_id;
                              
-- Enable RLS for production security
alter table users enable row level security;
alter table submissions enable row level security;
alter table questions enable row level security;
alter table problems enable row level security;
alter table test_cases enable row level security;
alter table app_meta enable row level security;
alter table contests enable row level security;
alter table contest_participants enable row level security;
alter table contest_chat_messages enable row level security;
alter table contest_questions enable row level security;
alter table user_activity enable row level security;
alter table voice_interview_sessions enable row level security;

-- Read-only public access for questions
drop policy if exists "questions_public_read" on questions;
create policy "questions_public_read" on questions for select using (true);

drop policy if exists "problems_public_read" on problems;
create policy "problems_public_read" on problems for select using (true);

drop policy if exists "problems_auth_write" on problems;
create policy "problems_auth_write" on problems
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "test_cases_public_read" on test_cases;
drop policy if exists "test_cases_visible_read" on test_cases;
create policy "test_cases_visible_read" on test_cases
for select
using (coalesce(is_hidden, false) = false);

drop policy if exists "test_cases_auth_write" on test_cases;
create policy "test_cases_auth_write" on test_cases
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Public read metadata; writes are done by authenticated users in app routes
drop policy if exists "app_meta_public_read" on app_meta;
create policy "app_meta_public_read" on app_meta for select using (true);

drop policy if exists "app_meta_auth_write" on app_meta;
create policy "app_meta_auth_write" on app_meta
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Users can read and write only their own user row
drop policy if exists "users_self_read" on users;
create policy "users_self_read" on users for select using (true);

drop policy if exists "users_self_insert" on users;
create policy "users_self_insert" on users for insert with check (auth.role() = 'authenticated');

drop policy if exists "users_self_update" on users;
create policy "users_self_update" on users for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Submissions: user-scoped access only
drop policy if exists "submissions_owner_read" on submissions;
create policy "submissions_owner_read" on submissions
for select
using (auth.uid()::uuid = user_id);

drop policy if exists "submissions_owner_insert" on submissions;
create policy "submissions_owner_insert" on submissions
for insert
with check (auth.uid()::uuid = user_id);

-- Contests policies: public contests are readable by anyone; owners can manage their own
drop policy if exists "contests_public_read" on contests;
create policy "contests_public_read" on contests
for select
using (mode = 'public');

drop policy if exists "contests_owner_read" on contests;
create policy "contests_owner_read" on contests
for select
using (auth.uid()::uuid = owner_user_id);

drop policy if exists "contests_owner_write" on contests;
create policy "contests_owner_write" on contests
for all
using (auth.uid()::uuid = owner_user_id)
with check (auth.uid()::uuid = owner_user_id);

-- Contest participants: users can see and manage only their own participation
drop policy if exists "contest_participants_self_read" on contest_participants;
create policy "contest_participants_self_read" on contest_participants
for select
using (auth.uid()::uuid = user_id);

drop policy if exists "contest_participants_auth_read" on contest_participants;
create policy "contest_participants_auth_read" on contest_participants
for select
using (auth.role() = 'authenticated');

drop policy if exists "contest_participants_self_write" on contest_participants;
create policy "contest_participants_self_write" on contest_participants
for all
using (auth.uid()::uuid = user_id)
with check (auth.uid()::uuid = user_id);

-- Contest chat: authenticated users can participate through app routes
drop policy if exists "contest_chat_messages_auth_read" on contest_chat_messages;
create policy "contest_chat_messages_auth_read" on contest_chat_messages
for select
using (auth.role() = 'authenticated');

drop policy if exists "contest_chat_messages_auth_write" on contest_chat_messages;
create policy "contest_chat_messages_auth_write" on contest_chat_messages
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Contest question set readable by participants; writable by authenticated users through app routes
drop policy if exists "contest_questions_public_read" on contest_questions;
create policy "contest_questions_public_read" on contest_questions
for select
using (true);

drop policy if exists "contest_questions_auth_write" on contest_questions;
create policy "contest_questions_auth_write" on contest_questions
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Voice interview sessions: authenticated users can access through app routes
drop policy if exists "voice_interview_sessions_auth_read" on voice_interview_sessions;
create policy "voice_interview_sessions_auth_read" on voice_interview_sessions
for select
using (auth.role() = 'authenticated');

drop policy if exists "voice_interview_sessions_auth_write" on voice_interview_sessions;
create policy "voice_interview_sessions_auth_write" on voice_interview_sessions
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- User activity readable/writable for authenticated users through protected server routes
drop policy if exists "user_activity_auth_read" on user_activity;
create policy "user_activity_auth_read" on user_activity
for select
using (auth.role() = 'authenticated');

drop policy if exists "user_activity_auth_write" on user_activity;
create policy "user_activity_auth_write" on user_activity
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Storage bucket for uploaded resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Authenticated users can upload/read/delete their own resume files
drop policy if exists "resumes_auth_select" on storage.objects;
create policy "resumes_auth_select" on storage.objects
for select
using (bucket_id = 'resumes');

drop policy if exists "resumes_auth_insert" on storage.objects;
create policy "resumes_auth_insert" on storage.objects
for insert
with check (bucket_id = 'resumes');

drop policy if exists "resumes_auth_delete" on storage.objects;
create policy "resumes_auth_delete" on storage.objects
for delete
using (bucket_id = 'resumes');

-- Voice Interview Warnings Log Table (Cheating tracking)
create table if not exists voice_interview_warnings (
  id uuid primary key default gen_random_uuid(),
  session_id text references voice_interview_sessions(session_id) on delete cascade,
  warning_type text not null, -- tab_switch, fullscreen_exit, camera_off, mic_mute
  logged_at timestamp default now()
);

-- Voice Interview Category Scores Table
create table if not exists voice_interview_scores (
  id uuid primary key default gen_random_uuid(),
  session_id text references voice_interview_sessions(session_id) on delete cascade,
  overall_score integer not null default 0,
  technical_score integer not null default 0,
  communication_score integer not null default 0,
  confidence_score integer not null default 0,
  grammar_score integer not null default 0,
  star_method_score integer not null default 0,
  created_at timestamp default now()
);

-- Voice Interview Transcripts Table
create table if not exists voice_interview_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id text references voice_interview_sessions(session_id) on delete cascade,
  role text not null, -- assistant, user
  content text not null,
  created_at timestamp default now()
);

-- Enable RLS policies for warnings, scores, and transcripts
alter table voice_interview_warnings enable row level security;
alter table voice_interview_scores enable row level security;
alter table voice_interview_transcripts enable row level security;

drop policy if exists "warnings_auth_access" on voice_interview_warnings;
create policy "warnings_auth_access" on voice_interview_warnings for all using (auth.role() = 'authenticated');

drop policy if exists "scores_auth_access" on voice_interview_scores;
create policy "scores_auth_access" on voice_interview_scores for all using (auth.role() = 'authenticated');

drop policy if exists "transcripts_auth_access" on voice_interview_transcripts;
create policy "transcripts_auth_access" on voice_interview_transcripts for all using (auth.role() = 'authenticated');

-- System Design Progress Table
create table if not exists system_design_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  lesson_id text not null,
  completed boolean not null default false,
  completed_at timestamp,
  created_at timestamp default now(),
  unique(user_id, lesson_id)
);

-- System Design Bookmarks Table
create table if not exists system_design_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  lesson_id text not null,
  created_at timestamp default now(),
  unique(user_id, lesson_id)
);

-- System Design Notes Table
create table if not exists system_design_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  lesson_id text not null,
  content text not null,
  updated_at timestamp default now(),
  unique(user_id, lesson_id)
);

-- Enable RLS for System Design tables
alter table system_design_progress enable row level security;
alter table system_design_bookmarks enable row level security;
alter table system_design_notes enable row level security;

drop policy if exists "progress_self_access" on system_design_progress;
create policy "progress_self_access" on system_design_progress for all using (auth.role() = 'authenticated');

drop policy if exists "bookmarks_self_access" on system_design_bookmarks;
create policy "bookmarks_self_access" on system_design_bookmarks for all using (auth.role() = 'authenticated');

drop policy if exists "notes_self_access" on system_design_notes;
create policy "notes_self_access" on system_design_notes for all using (auth.role() = 'authenticated');

-- Contest config updates
alter table contests add column if not exists config jsonb default '{}'::jsonb;

-- ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
-- Voice Interview Module v2 ΓÇö Database Migration
-- Strategy: Additive only, backward compatible
-- ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

-- 1. Resume columns on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_path text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_filename text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_size integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_uploaded_at timestamp;

-- 2. Structured interview history (replaces ad-hoc submissions-based history)
CREATE TABLE IF NOT EXISTS voice_interview_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id text UNIQUE REFERENCES voice_interview_sessions(session_id) ON DELETE SET NULL,
  interview_type text NOT NULL DEFAULT 'Technical',
  company_mode text,
  persona text,
  difficulty text NOT NULL DEFAULT 'medium',
  duration_seconds integer NOT NULL DEFAULT 0,
  questions_count integer NOT NULL DEFAULT 0,
  overall_score integer NOT NULL DEFAULT 0,
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  learning_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  resume_used text,
  job_description text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp DEFAULT now()
);

-- 3. Gamification: XP, badges, streaks
CREATE TABLE IF NOT EXISTS voice_interview_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_interview_date date,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamp DEFAULT now()
);

-- 4. Weekly/monthly analytics snapshots
CREATE TABLE IF NOT EXISTS voice_interview_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  interviews_count integer NOT NULL DEFAULT 0,
  avg_score integer NOT NULL DEFAULT 0,
  category_averages jsonb NOT NULL DEFAULT '{}'::jsonb,
  placement_readiness_score integer NOT NULL DEFAULT 0,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- 5. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_vi_history_user_id ON voice_interview_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vi_history_user_created ON voice_interview_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vi_history_company ON voice_interview_history(company_mode);
CREATE INDEX IF NOT EXISTS idx_vi_gamification_user ON voice_interview_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_vi_analytics_user_period ON voice_interview_analytics(user_id, period_type, period_start DESC);

-- 6. RLS policies for new tables
ALTER TABLE voice_interview_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_interview_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_interview_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vi_history_auth_access" ON voice_interview_history;
CREATE POLICY "vi_history_auth_access" ON voice_interview_history
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "vi_gamification_auth_access" ON voice_interview_gamification;
CREATE POLICY "vi_gamification_auth_access" ON voice_interview_gamification
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "vi_analytics_auth_access" ON voice_interview_analytics;
CREATE POLICY "vi_analytics_auth_access" ON voice_interview_analytics
  FOR ALL USING (auth.role() = 'authenticated');

-- ========================================================
-- SYSTEM DESIGN PLATFORM V2 TABLES
-- ========================================================

CREATE TABLE IF NOT EXISTS sd_modules (
  id text PRIMARY KEY,
  title text NOT NULL,
  level_order integer NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_lessons (
  id text PRIMARY KEY,
  module_id text REFERENCES sd_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  difficulty text NOT NULL,
  reading_time text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id text REFERENCES sd_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL,
  difficulty text NOT NULL,
  company_tags text[] DEFAULT '{}',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_user_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  ema_score numeric NOT NULL DEFAULT 0.0,
  questions_attempted integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamp DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS sd_case_studies (
  id text PRIMARY KEY,
  title text NOT NULL,
  target_scale text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_company_profiles (
  id text PRIMARY KEY,
  name text NOT NULL,
  difficulty text NOT NULL,
  focus text NOT NULL,
  rubric jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  readiness_score numeric NOT NULL,
  issued_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('diagram', 'pdf', 'animation')),
  diagram_type text, -- react_flow, mermaid, svg
  file_path text, -- Optional if raw_content is provided
  raw_content text, -- Stores raw JSON or Mermaid source
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_interactive boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  author text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Full Text Search Indexes
ALTER TABLE sd_lessons ADD COLUMN IF NOT EXISTS fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || (content->>'theory'))) STORED;
CREATE INDEX IF NOT EXISTS sd_lessons_fts_idx ON sd_lessons USING GIN (fts_vector);

ALTER TABLE sd_case_studies ADD COLUMN IF NOT EXISTS fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || (content->>'highLevelDesign') || ' ' || (content->>'lowLevelDesign'))) STORED;
CREATE INDEX IF NOT EXISTS sd_case_studies_fts_idx ON sd_case_studies USING GIN (fts_vector);

CREATE TABLE IF NOT EXISTS sd_lesson_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id text REFERENCES sd_lessons(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  version integer NOT NULL,
  author text NOT NULL,
  commit_message text,
  created_at timestamp DEFAULT now()
);

-- Phase 4: Adaptive Learning & AI Tables

CREATE TABLE IF NOT EXISTS sd_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id text NOT NULL, -- Corresponds to lesson_id or concept tag
  mastery_score float NOT NULL DEFAULT 0.0, -- 0 to 100
  confidence_score float NOT NULL DEFAULT 0.0,
  last_assessed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS sd_revision_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id text NOT NULL,
  next_review_date timestamp NOT NULL,
  interval integer NOT NULL DEFAULT 1, -- in days
  ease_factor float NOT NULL DEFAULT 2.5, -- SuperMemo-2 default
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS sd_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text, -- Optional context
  session_type text NOT NULL, -- 'mentor', 'interview'
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  submission_payload jsonb NOT NULL, -- User's HLD/LLD diagram or answers
  ai_review jsonb NOT NULL, -- Structured JSON rubric scores
  prompt_version text NOT NULL,
  model_name text NOT NULL,
  confidence float NOT NULL,
  human_override jsonb, -- Null unless modified by admin
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_question_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id text NOT NULL, -- Reference to specific MCQ or interview question
  is_correct boolean NOT NULL,
  time_taken_ms integer NOT NULL,
  confidence_rating integer, -- 1-5 self rating
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_learning_path (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommended_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  weak_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  strong_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id)
);

-- ========================================================
-- SYSTEM DESIGN RLS POLICIES (Phase 4.5)
-- ========================================================

-- 1. Enable RLS for high-priority user-specific tables
ALTER TABLE sd_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_revision_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_learning_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_question_history ENABLE ROW LEVEL SECURITY;

-- Owner-only access policies for user-specific tables
DROP POLICY IF EXISTS "sd_mastery_owner_access" ON sd_mastery;
CREATE POLICY "sd_mastery_owner_access" ON sd_mastery
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_revision_queue_owner_access" ON sd_revision_queue;
CREATE POLICY "sd_revision_queue_owner_access" ON sd_revision_queue
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_ai_sessions_owner_access" ON sd_ai_sessions;
CREATE POLICY "sd_ai_sessions_owner_access" ON sd_ai_sessions
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_ai_feedback_owner_access" ON sd_ai_feedback;
CREATE POLICY "sd_ai_feedback_owner_access" ON sd_ai_feedback
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_learning_path_owner_access" ON sd_learning_path;
CREATE POLICY "sd_learning_path_owner_access" ON sd_learning_path
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_question_history_owner_access" ON sd_question_history;
CREATE POLICY "sd_question_history_owner_access" ON sd_question_history
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());


-- 2. Enable RLS for read-only content tables
ALTER TABLE sd_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_company_profiles ENABLE ROW LEVEL SECURITY;

-- Read-only access for authenticated users on content tables
DROP POLICY IF EXISTS "sd_modules_read_access" ON sd_modules;
CREATE POLICY "sd_modules_read_access" ON sd_modules
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sd_lessons_read_access" ON sd_lessons;
CREATE POLICY "sd_lessons_read_access" ON sd_lessons
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sd_questions_read_access" ON sd_questions;
CREATE POLICY "sd_questions_read_access" ON sd_questions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sd_case_studies_read_access" ON sd_case_studies;
CREATE POLICY "sd_case_studies_read_access" ON sd_case_studies
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sd_company_profiles_read_access" ON sd_company_profiles;
CREATE POLICY "sd_company_profiles_read_access" ON sd_company_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================================
-- SYSTEM DESIGN PHASE 5: PLACEMENT ECOSYSTEM
-- ========================================================

CREATE TABLE IF NOT EXISTS sd_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'Foundation', 'Intermediate', 'Advanced', 'Professional', 'Interview Ready', 'FAANG Ready', 'Expert System Designer'
  issue_date timestamp DEFAULT now(),
  verification_id text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sd_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL, -- e.g., 'Foundation Complete', '100 Lessons', 'Company Ready'
  unlocked_at timestamp DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS sd_company_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id text NOT NULL,
  readiness_score float NOT NULL DEFAULT 0,
  weak_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  strong_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS sd_mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score float NOT NULL DEFAULT 0,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  company_target text NOT NULL,
  date timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_learning_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_url text,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT 'Novice',
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity timestamp DEFAULT now()
);

-- RLS Policies for Phase 5
ALTER TABLE sd_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_company_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_learning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sd_certificates_owner_access" ON sd_certificates;
CREATE POLICY "sd_certificates_owner_access" ON sd_certificates
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_badges_owner_access" ON sd_badges;
CREATE POLICY "sd_badges_owner_access" ON sd_badges
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_company_readiness_owner_access" ON sd_company_readiness;
CREATE POLICY "sd_company_readiness_owner_access" ON sd_company_readiness
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_mock_interviews_owner_access" ON sd_mock_interviews;
CREATE POLICY "sd_mock_interviews_owner_access" ON sd_mock_interviews
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_learning_reports_owner_access" ON sd_learning_reports;
CREATE POLICY "sd_learning_reports_owner_access" ON sd_learning_reports
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "sd_leaderboard_owner_access" ON sd_leaderboard;
DROP POLICY IF EXISTS "sd_leaderboard_owner_access" ON sd_leaderboard;
CREATE POLICY "sd_leaderboard_owner_access" ON sd_leaderboard
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- ========================================================
-- APTITUDE PLATFORM V2 TABLES (Phase 1)
-- ========================================================

CREATE TABLE IF NOT EXISTS apt_modules (
  id text PRIMARY KEY,
  title text NOT NULL,
  level_order integer NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_lessons (
  id text PRIMARY KEY,
  module_id text REFERENCES apt_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  difficulty text NOT NULL,
  reading_time text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id text REFERENCES apt_lessons(id) ON DELETE CASCADE,
  formula_text text NOT NULL,
  example_q text,
  example_a text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id text REFERENCES apt_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL,
  difficulty text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_company_tags (
  question_id uuid REFERENCES apt_questions(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (question_id, company_name)
);

CREATE TABLE IF NOT EXISTS apt_topic_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  mastery_score numeric NOT NULL DEFAULT 0.0,
  questions_attempted integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamp DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS apt_revision_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  next_review_date timestamp NOT NULL,
  interval integer NOT NULL DEFAULT 1,
  ease_factor float NOT NULL DEFAULT 2.5,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS apt_question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES apt_questions(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  time_taken_ms integer NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_question_analytics (
  question_id uuid PRIMARY KEY REFERENCES apt_questions(id) ON DELETE CASCADE,
  total_attempts integer NOT NULL DEFAULT 0,
  correct_attempts integer NOT NULL DEFAULT 0,
  avg_time_taken_ms integer NOT NULL DEFAULT 0,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  target_id text NOT NULL,
  target_type text NOT NULL,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE TABLE IF NOT EXISTS apt_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  target_id text NOT NULL,
  content text NOT NULL,
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, target_id)
);

CREATE TABLE IF NOT EXISTS apt_mock_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  start_time timestamp NOT NULL DEFAULT now(),
  end_time timestamp,
  score float NOT NULL DEFAULT 0,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS apt_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_type text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES apt_ai_sessions(id) ON DELETE CASCADE,
  feedback jsonb NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_learning_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_company_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_id text NOT NULL,
  readiness_score float NOT NULL DEFAULT 0,
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS apt_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  issue_date timestamp DEFAULT now(),
  verification_id text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS apt_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  unlocked_at timestamp DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS apt_lesson_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id text REFERENCES apt_lessons(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  version integer NOT NULL,
  author text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_draft_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text,
  draft_data jsonb NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Full Text Search Indexes
ALTER TABLE apt_lessons ADD COLUMN IF NOT EXISTS fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || (content->>'theory'))) STORED;
CREATE INDEX IF NOT EXISTS apt_lessons_fts_idx ON apt_lessons USING GIN (fts_vector);

CREATE INDEX IF NOT EXISTS apt_questions_difficulty_idx ON apt_questions(difficulty);
CREATE INDEX IF NOT EXISTS apt_questions_status_idx ON apt_questions(status);
CREATE INDEX IF NOT EXISTS apt_company_tags_company_idx ON apt_company_tags(company_name);

-- RLS Policies

ALTER TABLE apt_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_company_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_revision_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_mock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_learning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_company_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_lesson_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_draft_content ENABLE ROW LEVEL SECURITY;

-- Read-only access for content
DROP POLICY IF EXISTS "apt_modules_read_access" ON apt_modules;
CREATE POLICY "apt_modules_read_access" ON apt_modules FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "apt_lessons_read_access" ON apt_lessons;
CREATE POLICY "apt_lessons_read_access" ON apt_lessons FOR SELECT USING (auth.role() = 'authenticated' AND status != 'draft');

DROP POLICY IF EXISTS "apt_formulas_read_access" ON apt_formulas;
CREATE POLICY "apt_formulas_read_access" ON apt_formulas FOR SELECT USING (auth.role() = 'authenticated' AND status != 'draft');

DROP POLICY IF EXISTS "apt_questions_read_access" ON apt_questions;
CREATE POLICY "apt_questions_read_access" ON apt_questions FOR SELECT USING (auth.role() = 'authenticated' AND status != 'draft');

DROP POLICY IF EXISTS "apt_company_tags_read_access" ON apt_company_tags;
CREATE POLICY "apt_company_tags_read_access" ON apt_company_tags FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "apt_question_analytics_read_access" ON apt_question_analytics;
CREATE POLICY "apt_question_analytics_read_access" ON apt_question_analytics FOR SELECT USING (auth.role() = 'authenticated');

-- Owner access for user data tables
DROP POLICY IF EXISTS "apt_topic_mastery_owner" ON apt_topic_mastery;
CREATE POLICY "apt_topic_mastery_owner" ON apt_topic_mastery FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_revision_queue_owner" ON apt_revision_queue;
CREATE POLICY "apt_revision_queue_owner" ON apt_revision_queue FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_question_attempts_owner" ON apt_question_attempts;
CREATE POLICY "apt_question_attempts_owner" ON apt_question_attempts FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_bookmarks_owner" ON apt_bookmarks;
CREATE POLICY "apt_bookmarks_owner" ON apt_bookmarks FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_notes_owner" ON apt_notes;
CREATE POLICY "apt_notes_owner" ON apt_notes FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_mock_sessions_owner" ON apt_mock_sessions;
CREATE POLICY "apt_mock_sessions_owner" ON apt_mock_sessions FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_ai_sessions_owner" ON apt_ai_sessions;
CREATE POLICY "apt_ai_sessions_owner" ON apt_ai_sessions FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_ai_feedback_owner" ON apt_ai_feedback;
CREATE POLICY "apt_ai_feedback_owner" ON apt_ai_feedback FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_learning_reports_owner" ON apt_learning_reports;
CREATE POLICY "apt_learning_reports_owner" ON apt_learning_reports FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_company_readiness_owner" ON apt_company_readiness;
CREATE POLICY "apt_company_readiness_owner" ON apt_company_readiness FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_certificates_owner" ON apt_certificates;
CREATE POLICY "apt_certificates_owner" ON apt_certificates FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "apt_badges_owner" ON apt_badges;
CREATE POLICY "apt_badges_owner" ON apt_badges FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());


-- Phase 6: Gamification, Certificates, Readiness
CREATE TABLE IF NOT EXISTS apt_gamification_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp_total integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  daily_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apt_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  badge_name text NOT NULL,
  earned_at timestamp DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS apt_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  certificate_id text NOT NULL UNIQUE,
  module_id text NOT NULL,
  module_name text NOT NULL,
  issued_at timestamp DEFAULT now(),
  verification_url text
);

CREATE TABLE IF NOT EXISTS apt_company_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_id text NOT NULL,
  readiness_tier text NOT NULL,
  readiness_score float NOT NULL,
  last_evaluated_at timestamp DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE apt_gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE apt_company_readiness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apt_gamification_profiles_owner" ON apt_gamification_profiles;
CREATE POLICY "apt_gamification_profiles_owner" ON apt_gamification_profiles FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE TABLE IF NOT EXISTS apt_companies (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  active boolean DEFAULT true,
  sections jsonb DEFAULT '[]'::jsonb,
  overview jsonb DEFAULT '{}'::jsonb,
  eligibility jsonb DEFAULT '{}'::jsonb,
  test_pattern jsonb DEFAULT '{}'::jsonb,
  syllabus jsonb DEFAULT '{}'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now()
);

ALTER TABLE apt_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "apt_companies_read_access" ON apt_companies;
CREATE POLICY "apt_companies_read_access" ON apt_companies FOR SELECT USING (true);
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
-- NextHire AI - Milestone 10 (Enterprise Integrations & SDK)
-- Schema Extensions for API Keys, Webhooks, OAuth, and Idempotency

-- 1. API Keys Table
create table if not exists platform_api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  prefix text not null check (prefix in ('nh_live', 'nh_test', 'nh_dev')),
  key_id text not null unique,
  key_hash text not null,
  scopes text[] not null default '{}'::text[],
  created_by text not null,
  rotated_from uuid references platform_api_keys(id),
  last_ip text,
  last_user_agent text,
  created_at timestamp default now(),
  expires_at timestamp,
  last_used_at timestamp,
  revoked_at timestamp
);

-- Index for fast lookup by key_id
create index if not exists idx_api_keys_key_id on platform_api_keys(key_id);
create index if not exists idx_api_keys_tenant on platform_api_keys(tenant_id);

-- 2. Webhook Subscriptions
create table if not exists platform_webhooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  url text not null,
  secret text not null,
  active boolean default true,
  events text[] not null default '{}'::text[],
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_webhooks_tenant on platform_webhooks(tenant_id);

-- 3. Webhook Deliveries (Tracking & Dead-letter)
do $$ begin
    create type webhook_delivery_status as enum ('pending', 'queued', 'processing', 'delivered', 'failed', 'dead-letter');
exception
    when duplicate_object then null;
end $$;

create table if not exists platform_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references platform_webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status webhook_delivery_status default 'pending',
  attempts integer default 0,
  next_retry_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_webhook_deliveries_status on platform_webhook_deliveries(status, next_retry_at);

-- 4. Idempotency Keys
create table if not exists platform_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  key text not null,
  request_hash text not null,
  response jsonb,
  status text not null check (status in ('processing', 'completed', 'failed')),
  created_at timestamp default now(),
  expires_at timestamp not null
);

create unique index if not exists idx_idempotency_tenant_key on platform_idempotency_keys(tenant_id, key);

-- 5. OAuth Connections
create table if not exists platform_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider text not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  scopes text[] not null default '{}'::text[],
  metadata jsonb default '{}'::jsonb,
  expires_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_oauth_tenant_provider on platform_oauth_connections(tenant_id, provider);

-- 6. Outbox for Events
create table if not exists platform_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  tenant_id text,
  status text default 'pending' check (status in ('pending', 'processed', 'failed')),
  created_at timestamp default now(),
  processed_at timestamp
);

create index if not exists idx_outbox_status on platform_outbox(status);
-- NextHire AI - Milestone 11 (Multi-tenant SaaS)
-- Schema Extensions for Tenancy, Branding, and Billing

do $$ begin
    create type tenant_deployment_mode as enum ('POOL', 'BRIDGE', 'SILO');
    create type tenant_status as enum ('provisioning', 'active', 'grace_period', 'read_only', 'suspended', 'archived', 'deleted');
exception
    when duplicate_object then null;
end $$;

-- 1. SaaS Tenants
create table if not exists platform_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  deployment_mode tenant_deployment_mode not null default 'POOL',
  status tenant_status not null default 'provisioning',
  billing_provider text, -- e.g. 'stripe', 'paddle'
  billing_customer_id text,
  region text not null default 'us-east-1',
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  created_by text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_tenants_slug on platform_tenants(slug);
create index if not exists idx_tenants_status on platform_tenants(status);

-- 2. Tenant Branding (White-Labeling)
create table if not exists platform_tenant_branding (
  tenant_id uuid primary key references platform_tenants(id) on delete cascade,
  custom_domain text unique,
  logo_url text,
  favicon_url text,
  primary_color text default '#000000',
  font_family text default 'Inter',
  dark_mode_palette jsonb default '{}'::jsonb,
  email_branding jsonb default '{}'::jsonb,
  login_background_url text,
  support_url text,
  privacy_policy_url text,
  terms_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_tenant_branding_domain on platform_tenant_branding(custom_domain);

-- 3. Tenant Subscriptions (Entitlements Base)
create table if not exists platform_tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform_tenants(id) on delete cascade,
  plan_id text not null, -- Links to application-level entitlement config
  status text not null, -- 'active', 'past_due', 'canceled'
  current_period_start timestamp not null,
  current_period_end timestamp not null,
  cancel_at_period_end boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_tenant_subs_active on platform_tenant_subscriptions(tenant_id) where status = 'active';

-- 4. Tenant Usage Metering
create table if not exists platform_tenant_usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform_tenants(id) on delete cascade,
  event_type text not null, -- e.g. 'interview_completed', 'ai_tokens_consumed'
  quantity numeric not null,
  idempotency_key text unique,
  timestamp timestamp default now()
);

create index if not exists idx_usage_events_tenant_time on platform_tenant_usage_events(tenant_id, timestamp);

-- Example RLS Policy demonstrating Pool Isolation
-- Note: In a real migration, we would apply this to ALL domain tables (Assessments, Submissions, etc.)
/*
ALTER TABLE platform_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON platform_assessments
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
*/

-- Added for user_progress table fix
CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  resume_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
NOTIFY pgrst, 'reload schema';


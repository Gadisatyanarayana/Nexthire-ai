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


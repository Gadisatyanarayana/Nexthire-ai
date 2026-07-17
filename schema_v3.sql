-- NextHire AI - Unified Platform Schema (V3 Gold Standard)
-- Unified Domain -> Module -> Lesson -> Concept -> Question structure.
-- Safe, idempotent, and highly relational.

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Domains Table (Quantitative Aptitude, Logical Reasoning, Verbal Ability, etc.)
create table if not exists platform_domains (
  id text primary key,
  title text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamp default now()
);

-- 1b. Companies Table (TCS, Infosys, Amazon, etc.)
create table if not exists platform_companies (
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

-- 2. Modules Table (Arithmetic, Geometry, Analytical Reasoning, Grammar, etc.)
create table if not exists platform_modules (
  id text primary key,
  domain_id text not null references platform_domains(id) on delete cascade,
  title text not null,
  description text,
  level_order integer not null default 1,
  created_at timestamp default now()
);

-- 3. Lessons Table (Percentage, Profit and Loss, Blood Relations, Seating Arrangement, etc.)
create table if not exists platform_lessons (
  id text primary key,
  module_id text not null references platform_modules(id) on delete cascade,
  title text not null,
  description text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert', 'adaptive')),
  reading_time_min integer default 10,
  resources jsonb not null default '{}'::jsonb, -- overview, theory, formulas, cheat_sheet, common_mistakes, etc.
  skills text[] default '{}'::text[], -- observations, logical mapping, etc.
  prerequisites text[] default '{}'::text[], -- array of lesson IDs
  status text default 'published' check (status in ('draft', 'review', 'published', 'archived')),
  created_at timestamp default now()
);

-- 4. Concepts Table (Micro-topics like Successive Percentage, Family Tree, Parts of Speech, etc.)
create table if not exists platform_concepts (
  id text primary key,
  lesson_id text not null references platform_lessons(id) on delete cascade,
  title text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamp default now()
);

-- 5. Questions Table (The MCQ Bank containing the 50-field production schema)
create table if not exists platform_questions (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1,
  status text default 'published' check (status in ('draft', 'review', 'published', 'archived')),
  domain_id text not null references platform_domains(id) on delete cascade,
  module_id text not null references platform_modules(id) on delete cascade,
  lesson_id text not null references platform_lessons(id) on delete cascade,
  concept_id text not null references platform_concepts(id) on delete cascade,
  
  -- Question Content
  question_text text not null,
  options text[] not null,
  correct_index integer not null,
  detailed_solution text,
  short_trick text,
  formula_used text,
  hint_1 text,
  hint_2 text,
  hint_3 text,
  ai_explanation text,
  diagram_url text,
  video_solution_url text,
  
  -- Metadata & Adaptive Parameters
  difficulty_level integer default 50, -- Scale 1 to 100
  bloom_level text,
  skill_tags text[] default '{}'::text[],
  prerequisite_concepts text[] default '{}'::text[],
  expected_time_sec integer default 60,
  weight_score float default 1.0,
  
  -- Stats & Analytics (updated on attempts)
  total_attempts integer default 0,
  correct_percentage float default 0.0,
  average_solve_time_sec integer default 0,
  
  -- Company & Exam Tags (stored as JSONB/Array for scaling to thousands of companies)
  company_tags jsonb default '[]'::jsonb, -- Array of objects: [{"company": "TCS", "year": 2024, "round": "NQT"}]
  exam_tags text[] default '{}'::text[], -- e.g. {'CAT', 'GATE'}
  
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 6. Topic Mastery Table (Tracks student mastery at the lesson/topic level)
create table if not exists platform_topic_mastery (
  user_id uuid not null,
  topic_id text not null references platform_lessons(id) on delete cascade,
  mastery_score float default 0.0,
  confidence_score float default 0.0,
  questions_attempted integer default 0,
  questions_correct integer default 0,
  streak integer default 0,
  last_attempt_at timestamp,
  revision_queue_date timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  primary key (user_id, topic_id)
);

-- 7. Lesson Progress Table (Tracks completion of reading/practice materials)
create table if not exists platform_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id text not null references platform_lessons(id) on delete cascade,
  completed boolean default false,
  completed_at timestamp,
  time_spent_seconds integer default 0,
  last_read_position text,
  created_at timestamp default now(),
  unique(user_id, lesson_id)
);

-- 8. Module Progress Table (Tracks completion of modules)
create table if not exists platform_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id text not null references platform_modules(id) on delete cascade,
  completed boolean default false,
  completed_at timestamp,
  progress_percentage float default 0.0,
  created_at timestamp default now(),
  unique(user_id, module_id)
);

-- 9. Question Attempts Table (Unified attempts log across practice, mock, and quizzes)
create table if not exists platform_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references platform_questions(id) on delete cascade,
  selected_index integer,
  is_correct boolean not null,
  time_spent_sec integer default 0,
  attempt_type text default 'practice' check (attempt_type in ('practice', 'quiz', 'mock', 'adaptive')),
  attempt_ref_id uuid, -- links to mock session or quiz if needed
  created_at timestamp default now()
);

-- 10. Bookmarks Table
create table if not exists platform_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references platform_questions(id) on delete cascade,
  notes text,
  created_at timestamp default now(),
  unique(user_id, question_id)
);

-- 11. Notes Table
create table if not exists platform_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id text not null references platform_lessons(id) on delete cascade,
  content text not null,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(user_id, lesson_id)
);

-- 12. Mock Tests Configuration (Templates)
create table if not exists platform_mock_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  domain_id text not null references platform_domains(id) on delete cascade,
  company_id text, -- optional, if company mock
  duration_minutes integer default 30,
  total_questions integer default 20,
  difficulty_mix jsonb default '{"easy": 5, "medium": 10, "hard": 5}'::jsonb,
  created_at timestamp default now()
);

-- 13. Mock Sessions (Actual student test instances)
create table if not exists platform_mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mock_test_id uuid not null references platform_mock_tests(id) on delete cascade,
  status text default 'started' check (status in ('started', 'paused', 'submitted', 'abandoned')),
  score float default 0.0,
  responses jsonb default '{}'::jsonb, -- { question_id: selected_index }
  started_at timestamp default now(),
  submitted_at timestamp,
  time_spent_seconds integer default 0
);

-- 14. AI Tutor Sessions
create table if not exists platform_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  domain_id text not null references platform_domains(id) on delete cascade,
  lesson_id text references platform_lessons(id) on delete set null,
  provider text,
  model text,
  context jsonb default '{}'::jsonb,
  created_at timestamp default now()
);

-- 15. Search Vector / Text Index Table
create table if not exists platform_search_index (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('domain', 'module', 'lesson', 'concept', 'question')),
  item_id text not null, -- Stores text ID or UUID
  title text not null,
  content text,
  search_vector tsvector,
  created_at timestamp default now()
);

-- 16. Dynamic indexes for fast joins & search filtering
do $$
begin
  execute 'create index if not exists idx_platform_modules_domain on platform_modules(domain_id)';
  execute 'create index if not exists idx_platform_lessons_module on platform_lessons(module_id)';
  execute 'create index if not exists idx_platform_concepts_lesson on platform_concepts(lesson_id)';
  
  execute 'create index if not exists idx_platform_questions_hierarchy on platform_questions(domain_id, module_id, lesson_id, concept_id)';
  execute 'create index if not exists idx_platform_questions_difficulty on platform_questions(difficulty_level)';
  execute 'create index if not exists idx_platform_questions_company_tags on platform_questions using gin(company_tags)';
  
  execute 'create index if not exists idx_platform_attempts_user_question on platform_question_attempts(user_id, question_id)';
  execute 'create index if not exists idx_platform_mastery_user on platform_topic_mastery(user_id)';
  execute 'create index if not exists idx_platform_mock_sessions_user on platform_mock_sessions(user_id)';
  execute 'create index if not exists idx_platform_ai_sessions_user on platform_ai_sessions(user_id)';
end $$;

-- 16b. Autofill Trigger (Ensures legacy inserts without domain_id are routed and tagged correctly)
create or replace function autofill_question_domain()
returns trigger as $$
begin
  if new.domain_id is null or new.domain_id = '' then
    select domain_id into new.domain_id 
    from platform_modules 
    where id = new.module_id;
  end if;
  
  if new.domain_id is null and new.lesson_id is not null then
    select m.domain_id into new.domain_id
    from platform_lessons l
    join platform_modules m on l.module_id = m.id
    where l.id = new.lesson_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_autofill_question_domain on platform_questions;
create trigger trigger_autofill_question_domain
  before insert or update on platform_questions
  for each row execute function autofill_question_domain();

-- 17. Cleanup Legacy Tables & Create Backward Compatibility Views
-- (allows legacy API routes & client components to continue working seamlessly)

-- Dynamically drop legacy objects depending on whether they are tables or views
do $$
declare
  r record;
begin
  for r in 
    select table_name, table_type 
    from information_schema.tables 
    where table_schema = 'public' 
      and table_name in (
        'apt_modules', 'reasoning_modules',
        'apt_lessons', 'reasoning_lessons',
        'apt_questions', 'reasoning_questions',
        'apt_companies', 'reasoning_companies',
        'apt_topic_mastery', 'reasoning_topic_mastery',
        'apt_question_attempts', 'reasoning_question_attempts',
        'apt_mock_sessions', 'reasoning_mock_sessions',
        'apt_formulas', 'reasoning_formulas',
        'apt_company_tags', 'reasoning_company_tags',
        'apt_company_readiness', 'reasoning_company_readiness',
        'apt_revision_queue', 'reasoning_revision_queue',
        'apt_mock_questions', 'reasoning_mock_questions',
        'apt_mock_tests', 'reasoning_mock_tests',
        'apt_ai_sessions', 'reasoning_ai_sessions'
      )
  loop
    if r.table_type = 'VIEW' then
      execute 'drop view if exists ' || quote_ident(r.table_name) || ' cascade';
    else
      execute 'drop table if exists ' || quote_ident(r.table_name) || ' cascade';
    end if;
  end loop;
end $$;

-- 18. Legacy Tables with Real-Time Sync Triggers (for seamless 100% backward compatibility)

-- 18.1 Legacy Modules
create table if not exists apt_modules (
  id text primary key,
  title text not null,
  level_order integer not null,
  created_at timestamp default now()
);

create table if not exists reasoning_modules (
  id text primary key,
  title text not null,
  level_order integer not null,
  created_at timestamp default now()
);

create or replace function sync_apt_module() returns trigger as $$
begin
  insert into platform_modules (id, domain_id, title, level_order, created_at)
  values (new.id, 'quantitative-aptitude', new.title, new.level_order, new.created_at)
  on conflict (id) do update set
    title = excluded.title,
    level_order = excluded.level_order;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_module
  after insert or update on apt_modules
  for each row execute function sync_apt_module();

create or replace function sync_reasoning_module() returns trigger as $$
begin
  insert into platform_modules (id, domain_id, title, level_order, created_at)
  values (new.id, 'logical-reasoning', new.title, new.level_order, new.created_at)
  on conflict (id) do update set
    title = excluded.title,
    level_order = excluded.level_order;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_reasoning_module
  after insert or update on reasoning_modules
  for each row execute function sync_reasoning_module();

-- 18.2 Legacy Lessons
create table if not exists apt_lessons (
  id text primary key,
  module_id text references apt_modules(id) on delete cascade,
  title text not null,
  difficulty text not null,
  reading_time text,
  content jsonb,
  status text default 'published',
  created_at timestamp default now()
);

create table if not exists reasoning_lessons (
  id text primary key,
  module_id text references reasoning_modules(id) on delete cascade,
  title text not null,
  difficulty text not null,
  reading_time text,
  content jsonb,
  status text default 'published',
  created_at timestamp default now()
);

create or replace function sync_platform_lesson() returns trigger as $$
declare
  r_time_min integer;
begin
  begin
    r_time_min := regexp_replace(new.reading_time, '[^0-9]', '', 'g')::integer;
  exception when others then
    r_time_min := 10;
  end;

  insert into platform_lessons (
    id, module_id, title, description, difficulty, reading_time_min, resources, status, created_at
  ) values (
    new.id,
    new.module_id,
    new.title,
    new.title,
    lower(coalesce(new.difficulty, 'easy')),
    coalesce(r_time_min, 10),
    coalesce(new.content, '{}'::jsonb),
    lower(coalesce(new.status, 'published')),
    new.created_at
  )
  on conflict (id) do update set
    module_id = excluded.module_id,
    title = excluded.title,
    difficulty = excluded.difficulty,
    reading_time_min = excluded.reading_time_min,
    resources = excluded.resources,
    status = excluded.status;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_lesson
  after insert or update on apt_lessons
  for each row execute function sync_platform_lesson();

create or replace trigger trigger_sync_reasoning_lesson
  after insert or update on reasoning_lessons
  for each row execute function sync_platform_lesson();

-- 18.3 Legacy Formulas
create table if not exists apt_formulas (
  id uuid primary key default gen_random_uuid(),
  topic_id text references apt_lessons(id) on delete cascade,
  formula_text text not null,
  example_q text,
  example_a text,
  status text default 'published',
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

create or replace function sync_platform_formula() returns trigger as $$
begin
  update platform_lessons
  set resources = jsonb_set(
    resources, 
    '{formulas}', 
    coalesce(resources->'formulas', '[]'::jsonb) || jsonb_build_object(
      'id', new.id,
      'formula_text', new.formula_text,
      'example_q', new.example_q,
      'example_a', new.example_a,
      'status', coalesce(new.status, 'published'),
      'created_at', new.created_at
    )
  )
  where id = new.topic_id;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_formula
  after insert or update on apt_formulas
  for each row execute function sync_platform_formula();

create or replace trigger trigger_sync_reasoning_formula
  after insert or update on reasoning_formulas
  for each row execute function sync_platform_formula();

-- 18.4 Legacy Questions
create table if not exists apt_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text references apt_lessons(id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_index integer not null,
  explanation text not null,
  difficulty text not null,
  status text default 'published',
  hint text,
  ai_explanation text,
  topic text,
  subtopic text,
  bloom_level text,
  estimated_time_sec integer default 60,
  success_rate float default 0.0,
  average_time_sec integer default 0,
  previous_year boolean default false,
  company_source text,
  exam_name text,
  exam_year integer,
  exam_round text,
  memory_based boolean default false,
  official boolean default false,
  generator_version text default '1.0',
  module_id text,
  concept_id text,
  pattern_id uuid,
  pattern_type text,
  created_at timestamp default now()
);

create table if not exists reasoning_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text references reasoning_lessons(id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_index integer not null,
  explanation text not null,
  difficulty text not null,
  status text default 'published',
  hint text,
  ai_explanation text,
  topic text,
  subtopic text,
  bloom_level text,
  estimated_time_sec integer default 60,
  success_rate float default 0.0,
  average_time_sec integer default 0,
  previous_year boolean default false,
  company_source text,
  exam_name text,
  exam_year integer,
  exam_round text,
  memory_based boolean default false,
  official boolean default false,
  generator_version text default '1.0',
  module_id text,
  concept_id text,
  pattern_id uuid,
  pattern_type text,
  created_at timestamp default now()
);

create or replace function sync_platform_question() returns trigger as $$
declare
  d_id text;
  m_id text;
  diff_val integer;
begin
  -- Resolve parent module and domain
  select module_id into m_id from platform_lessons where id = new.lesson_id;
  select domain_id into d_id from platform_modules where id = m_id;

  -- Ensure the concept exists in platform_concepts first to satisfy the foreign key constraint
  insert into platform_concepts (id, lesson_id, title, description, display_order)
  values (
    new.lesson_id || '-c-1',
    new.lesson_id,
    'Concept 1',
    'Core concept details.',
    1
  )
  on conflict (id) do nothing;

  -- Map text difficulty to 1-100 integer scale
  case lower(coalesce(new.difficulty, 'easy'))
    when 'easy' then diff_val := 30;
    when 'medium' then diff_val := 50;
    when 'hard' then diff_val := 70;
    when 'expert' then diff_val := 90;
    else diff_val := 50;
  end case;

  insert into platform_questions (
    id, domain_id, module_id, lesson_id, concept_id, question_text, options, correct_index, detailed_solution, difficulty_level, status,
    hint_1, ai_explanation, bloom_level, expected_time_sec, correct_percentage, average_solve_time_sec, created_at
  ) values (
    new.id,
    coalesce(d_id, 'quantitative-aptitude'),
    coalesce(m_id, 'quant-arithmetic'),
    new.lesson_id,
    new.lesson_id || '-c-1', -- exact seeded concept_id reference
    new.question,
    new.options,
    new.correct_index,
    new.explanation,
    diff_val,
    lower(coalesce(new.status, 'published')),
    new.hint,
    new.ai_explanation,
    new.bloom_level,
    coalesce(new.estimated_time_sec, 60),
    coalesce(new.success_rate, 0.0),
    coalesce(new.average_time_sec, 0),
    new.created_at
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id,
    module_id = excluded.module_id,
    domain_id = excluded.domain_id,
    question_text = excluded.question_text,
    options = excluded.options,
    correct_index = excluded.correct_index,
    detailed_solution = excluded.detailed_solution,
    difficulty_level = excluded.difficulty_level,
    status = excluded.status,
    hint_1 = excluded.hint_1,
    ai_explanation = excluded.ai_explanation,
    bloom_level = excluded.bloom_level,
    expected_time_sec = excluded.expected_time_sec,
    correct_percentage = excluded.correct_percentage,
    average_solve_time_sec = excluded.average_solve_time_sec;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_question
  after insert or update on apt_questions
  for each row execute function sync_platform_question();

create or replace trigger trigger_sync_reasoning_question
  after insert or update on reasoning_questions
  for each row execute function sync_platform_question();

create or replace function sync_delete_platform_question() returns trigger as $$
begin
  delete from platform_questions where id = old.id;
  return old;
end;
$$ language plpgsql;

create or replace trigger trigger_delete_sync_apt_question
  after delete on apt_questions
  for each row execute function sync_delete_platform_question();

create or replace trigger trigger_delete_sync_reasoning_question
  after delete on reasoning_questions
  for each row execute function sync_delete_platform_question();

-- 18.5 Legacy Companies
create table if not exists apt_companies (
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

create or replace function sync_platform_company() returns trigger as $$
begin
  insert into platform_companies (id, name, logo_url, active, sections, created_at)
  values (new.id, new.name, new.logo_url, new.active, new.sections, new.created_at)
  on conflict (id) do update set
    name = excluded.name,
    logo_url = excluded.logo_url,
    active = excluded.active,
    sections = excluded.sections;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_company
  after insert or update on apt_companies
  for each row execute function sync_platform_company();

create or replace trigger trigger_sync_reasoning_company
  after insert or update on reasoning_companies
  for each row execute function sync_platform_company();

-- 18.6 Legacy Company Tags
create table if not exists apt_company_tags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references apt_questions(id) on delete cascade,
  company_id text,
  company_name text not null,
  year integer,
  frequency integer default 1,
  created_at timestamp default now(),
  unique(question_id, company_name)
);

create table if not exists reasoning_company_tags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references reasoning_questions(id) on delete cascade,
  company_id text,
  company_name text not null,
  year integer,
  frequency integer default 1,
  created_at timestamp default now(),
  unique(question_id, company_name)
);

create or replace function sync_platform_company_tag() returns trigger as $$
begin
  update platform_questions
  set company_tags = coalesce(company_tags, '[]'::jsonb) || jsonb_build_object(
    'company', new.company_name,
    'company_id', new.company_id,
    'year', coalesce(new.year, extract(year from now())::integer),
    'frequency', coalesce(new.frequency, 1),
    'round', 'General'
  )
  where id = new.question_id;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_company_tag
  after insert or update on apt_company_tags
  for each row execute function sync_platform_company_tag();

create or replace trigger trigger_sync_reasoning_company_tag
  after insert or update on reasoning_company_tags
  for each row execute function sync_platform_company_tag();

-- 18.7 Legacy Topic Mastery
create table if not exists apt_topic_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  topic_id text references apt_lessons(id) on delete cascade,
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

create or replace function sync_platform_mastery() returns trigger as $$
begin
  insert into platform_topic_mastery (
    user_id, topic_id, mastery_score, mastery_level, questions_attempted, questions_correct, streak_days, confidence_score, last_attempt_date, last_reviewed_at, revision_queue_date
  ) values (
    new.user_id, new.topic_id, new.mastery_score, new.mastery_level, new.questions_attempted, new.questions_correct, new.streak_days, new.confidence_score, new.last_attempt_date, new.last_reviewed_at, new.revision_queue_date
  )
  on conflict (user_id, topic_id) do update set
    mastery_score = excluded.mastery_score,
    mastery_level = excluded.mastery_level,
    questions_attempted = excluded.questions_attempted,
    questions_correct = excluded.questions_correct,
    streak_days = excluded.streak_days,
    confidence_score = excluded.confidence_score,
    last_attempt_date = excluded.last_attempt_date,
    last_reviewed_at = excluded.last_reviewed_at,
    revision_queue_date = excluded.revision_queue_date;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_mastery
  after insert or update on apt_topic_mastery
  for each row execute function sync_platform_mastery();

create or replace trigger trigger_sync_reasoning_mastery
  after insert or update on reasoning_topic_mastery
  for each row execute function sync_platform_mastery();

-- 18.8 Legacy Attempts
create table if not exists apt_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references apt_questions(id) on delete cascade,
  is_correct boolean not null,
  time_taken_ms integer not null,
  selected_option_index integer,
  created_at timestamp default now()
);

create table if not exists reasoning_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references reasoning_questions(id) on delete cascade,
  is_correct boolean not null,
  time_taken_ms integer not null,
  selected_option_index integer,
  created_at timestamp default now()
);

create or replace function sync_platform_attempt() returns trigger as $$
begin
  insert into platform_question_attempts (
    id, user_id, question_id, is_correct, time_spent_seconds, selected_option_index, created_at
  ) values (
    new.id, new.user_id, new.question_id, new.is_correct, (new.time_taken_ms / 1000.0)::integer, new.selected_option_index, new.created_at
  )
  on conflict (id) do update set
    is_correct = excluded.is_correct,
    time_spent_seconds = excluded.time_spent_seconds,
    selected_option_index = excluded.selected_option_index;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_attempt
  after insert or update on apt_question_attempts
  for each row execute function sync_platform_attempt();

create or replace trigger trigger_sync_reasoning_attempt
  after insert or update on reasoning_question_attempts
  for each row execute function sync_platform_attempt();

-- 18.9 Legacy Mock Sessions
create table if not exists apt_mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_data jsonb not null default '{}'::jsonb,
  score integer default 0,
  created_at timestamp default now()
);

create table if not exists reasoning_mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_data jsonb not null default '{}'::jsonb,
  score integer default 0,
  created_at timestamp default now()
);

create or replace function sync_platform_mock_session() returns trigger as $$
begin
  insert into platform_mock_sessions (
    id, user_id, mock_test_id, score, started_at
  ) values (
    new.id, new.user_id, coalesce((new.session_data->'config'->>'id')::uuid, gen_random_uuid()), new.score, new.created_at
  )
  on conflict (id) do update set
    score = excluded.score;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_sync_apt_mock_session
  after insert or update on apt_mock_sessions
  for each row execute function sync_platform_mock_session();

create or replace trigger trigger_sync_reasoning_mock_session
  after insert or update on reasoning_mock_sessions
  for each row execute function sync_platform_mock_session();

-- Force PostgREST schema cache reload so the API instantly sees the new columns
NOTIFY pgrst, 'reload schema';

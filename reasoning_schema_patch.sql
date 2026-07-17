-- -----------------------------------------------------------------------------
-- NextHire AI - Reasoning Schema Emergency Patch
-- -----------------------------------------------------------------------------
-- This script fixes the "column does not exist" (42703) errors. 
-- It is 100% idempotent and safe to run multiple times.

DO $$
BEGIN
  -- Fix reasoning_lessons
  BEGIN ALTER TABLE reasoning_lessons ADD COLUMN module_milestone boolean default false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_lessons ADD COLUMN generator_version text default '1.0'; EXCEPTION WHEN duplicate_column THEN NULL; END;

  -- Fix reasoning_formulas (This is the specific error you were seeing)
  BEGIN ALTER TABLE reasoning_formulas ADD COLUMN created_at timestamp default now(); EXCEPTION WHEN duplicate_column THEN NULL; END;

  -- Fix reasoning_questions
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN module_id text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN pattern_id uuid; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN exam_name text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN company_source text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN exam_year integer; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN exam_round text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN memory_based boolean default false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN official boolean default false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_questions ADD COLUMN generator_version text default '1.0'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  
  -- Fix reasoning_company_tags
  BEGIN ALTER TABLE reasoning_company_tags ADD COLUMN company_id text; EXCEPTION WHEN duplicate_column THEN NULL; END;

  -- Fix reasoning_ai_sessions
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN provider text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN model text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN temperature float; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN prompt_tokens integer default 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN completion_tokens integer default 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN response_time integer default 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN context jsonb default '{}'::jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN lesson_id text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN question_id uuid; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN company_id text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE reasoning_ai_sessions ADD COLUMN topic_id text; EXCEPTION WHEN duplicate_column THEN NULL; END;

END $$;

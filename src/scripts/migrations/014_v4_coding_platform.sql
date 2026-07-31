-- ==========================================
-- Phase 3: Coding Platform Core Schema
-- Migration 014
-- ==========================================

-- 1. Extension table for coding problem details
-- Links 1:1 with platform_questions where type = 'Coding'
CREATE TABLE IF NOT EXISTS coding_problem_details (
  question_id UUID PRIMARY KEY REFERENCES platform_questions(id) ON DELETE CASCADE,
  starter_code JSONB DEFAULT '{}'::jsonb, -- e.g. {"python": "def solve():\n  pass", "javascript": "function solve() {}"}
  supported_languages TEXT[] DEFAULT ARRAY['python', 'javascript', 'java', 'cpp']::TEXT[],
  constraints TEXT[] DEFAULT ARRAY[]::TEXT[],
  time_limit_ms INTEGER DEFAULT 2000,
  memory_limit_mb INTEGER DEFAULT 256,
  judge_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for coding_problem_details
ALTER TABLE coding_problem_details ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view coding details" ON coding_problem_details;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Anyone can view coding details"
  ON coding_problem_details FOR SELECT
  USING (true);

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage coding details" ON coding_problem_details;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- By default RLS blocks all writes. We rely on the Next.js API using SUPABASE_SERVICE_ROLE_KEY to manage coding details.

-- Trigger for coding_problem_details updated_at
DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_coding_details_updated_at ON coding_problem_details;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_coding_details_updated_at
  BEFORE UPDATE ON coding_problem_details
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 2. Editor Sessions table (Autosave and Persistence)
CREATE TABLE IF NOT EXISTS coding_editor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES platform_questions(id) ON DELETE CASCADE,
  current_language TEXT NOT NULL DEFAULT 'javascript',
  code_content TEXT NOT NULL DEFAULT '',
  cursor_position JSONB DEFAULT '{"lineNumber": 1, "column": 1}'::jsonb,
  is_submitted BOOLEAN DEFAULT false,
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, question_id)
);

-- Drop legacy FK constraints if table was created previously with them
DO $$ BEGIN
  ALTER TABLE coding_editor_sessions DROP CONSTRAINT IF EXISTS coding_editor_sessions_tenant_id_fkey;
  ALTER TABLE coding_editor_sessions DROP CONSTRAINT IF EXISTS coding_editor_sessions_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS for coding_editor_sessions
ALTER TABLE coding_editor_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own editor sessions" ON coding_editor_sessions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view their own editor sessions"
  ON coding_editor_sessions FOR SELECT
  USING (user_id = auth.uid());

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own editor sessions" ON coding_editor_sessions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can manage their own editor sessions"
  ON coding_editor_sessions FOR ALL
  USING (user_id = auth.uid());

-- Trigger for coding_editor_sessions updated_at (aliased to last_saved_at for semantic clarity)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_editor_session_updated_at ON coding_editor_sessions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE OR REPLACE FUNCTION handle_last_saved_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_saved_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_editor_session_updated_at
  BEFORE UPDATE ON coding_editor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_last_saved_at();

-- 3. Coding Submissions table (For Judges, Contests, Analytics)
CREATE TABLE IF NOT EXISTS coding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES platform_questions(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, RUNNING, COMPLETED, ERROR
  verdict TEXT, -- ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, etc.
  runtime_ms INTEGER,
  memory_kb INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Drop legacy FK constraints if table was created previously with them
DO $$ BEGIN
  ALTER TABLE coding_submissions DROP CONSTRAINT IF EXISTS coding_submissions_tenant_id_fkey;
  ALTER TABLE coding_submissions DROP CONSTRAINT IF EXISTS coding_submissions_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS for coding_submissions
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own submissions" ON coding_submissions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view their own submissions"
  ON coding_submissions FOR SELECT
  USING (user_id = auth.uid());

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own submissions" ON coding_submissions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can insert their own submissions"
  ON coding_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. Ensure platform_questions supports coding metadata fields and standalone problems
ALTER TABLE platform_questions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE platform_questions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Coding';
ALTER TABLE platform_questions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE platform_questions ADD COLUMN IF NOT EXISTS description_markdown TEXT;
ALTER TABLE platform_questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium';

-- Allow standalone coding problems (not tied to MCQ curriculum trees)
ALTER TABLE platform_questions ALTER COLUMN domain_id DROP NOT NULL;
ALTER TABLE platform_questions ALTER COLUMN module_id DROP NOT NULL;
ALTER TABLE platform_questions ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE platform_questions ALTER COLUMN concept_id DROP NOT NULL;
ALTER TABLE platform_questions ALTER COLUMN question_text DROP NOT NULL;
ALTER TABLE platform_questions ALTER COLUMN options DROP NOT NULL;
ALTER TABLE platform_questions ALTER COLUMN correct_index DROP NOT NULL;

-- 5. Mock Data for Coding Problem (For Development/Testing)
DO $$
DECLARE
  mock_tenant UUID := '11111111-1111-1111-1111-111111111111';
  coding_question_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Insert into platform_questions
  INSERT INTO platform_questions (
    id, tenant_id, type, difficulty, title, description_markdown
  )
  VALUES (
    coding_question_id,
    mock_tenant,
    'Coding',
    'Medium',
    'Two Sum',
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.'
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert into coding_problem_details
  INSERT INTO coding_problem_details (
    question_id, starter_code, supported_languages, constraints, time_limit_ms, memory_limit_mb
  )
  VALUES (
    coding_question_id,
    '{"python": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n", "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};\n"}'::jsonb,
    ARRAY['python', 'javascript']::TEXT[],
    ARRAY['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9']::TEXT[],
    2000,
    256
  ) ON CONFLICT (question_id) DO NOTHING;
END $$;

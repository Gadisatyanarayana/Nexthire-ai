-- 013_v3_assessment_engine.sql
-- Phase 2 Step 6: Assessment Engine & Attempt Management

-- Enums for Assessment State Machine
DO $$ BEGIN
  CREATE TYPE assessment_attempt_status AS ENUM (
    'DRAFT',
    'STARTED',
    'IN_PROGRESS',
    'SUBMITTED',
    'GRADED',
    'ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: We rely on the `platform_tenants` and `users` tables from the existing schema,
-- and use a generic `assessment_id` (TEXT) to link attempts to the corresponding 
-- domain-specific assessment (e.g., in `sd_modules`, `apt_modules`, or hardcoded config)
-- to avoid duplicating metadata in a parallel table.

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  
  -- State Machine
  status assessment_attempt_status NOT NULL DEFAULT 'STARTED',
  
  -- Scoring & Results
  score NUMERIC(5,2),
  max_score NUMERIC(5,2),
  earned_score NUMERIC(5,2),
  is_passed BOOLEAN,
  percentage NUMERIC(5,2),
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  unanswered INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  
  -- Timestamps & Metrics
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_elapsed_seconds INTEGER DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_assessment_attempts_updated_at ON assessment_attempts;
CREATE TRIGGER set_assessment_attempts_updated_at 
BEFORE UPDATE ON assessment_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  
  -- The actual answer payload
  answer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Evaluation (can be updated asynchronously by Submission Engine)
  is_correct BOOLEAN,
  score NUMERIC(5,2),
  
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Only one answer record per attempt/question combo
  UNIQUE(attempt_id, question_id)
);

-- Critical Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_tenant ON assessment_attempts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON assessment_answers(attempt_id);

-- Ensure a user can only have one active attempt per assessment at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_attempt_unique ON assessment_attempts (user_id, assessment_id) WHERE status IN ('STARTED', 'IN_PROGRESS');

-- Enable Row Level Security (RLS)
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON assessment_attempts;
CREATE POLICY "Users can view their own attempts" ON assessment_attempts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own attempts" ON assessment_attempts;
CREATE POLICY "Users can insert their own attempts" ON assessment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own attempts" ON assessment_attempts;
CREATE POLICY "Users can update their own attempts" ON assessment_attempts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own answers" ON assessment_answers;
CREATE POLICY "Users can view their own answers" ON assessment_answers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own answers" ON assessment_answers;
CREATE POLICY "Users can insert their own answers" ON assessment_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own answers" ON assessment_answers;
CREATE POLICY "Users can update their own answers" ON assessment_answers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

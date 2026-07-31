-- Migration: 016_v6_enterprise_coding_metadata.sql
-- Normalized Relational Metadata Architecture for NextHire Enterprise Coding Platform

-- 1. Question Solutions Table (Multi-Approach Model)
CREATE TABLE IF NOT EXISTS question_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  solution_title VARCHAR(255) NOT NULL,
  pattern_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  time_complexity VARCHAR(100) NOT NULL,
  space_complexity VARCHAR(100) NOT NULL,
  explanation_markdown TEXT NOT NULL,
  code_templates JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Question Topics & Subtopics
CREATE TABLE IF NOT EXISTS question_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  topic_name VARCHAR(255) NOT NULL,
  subtopic_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Question Patterns (Primary & Secondary)
CREATE TABLE IF NOT EXISTS question_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  pattern_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Question Companies & Frequencies
CREATE TABLE IF NOT EXISTS question_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  frequency_tier VARCHAR(50) NOT NULL CHECK (frequency_tier IN ('High', 'Medium', 'Low')),
  frequency_score INTEGER NOT NULL DEFAULT 50 CHECK (frequency_score BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Directed Learning Dependencies (Prerequisite DAG)
CREATE TABLE IF NOT EXISTS question_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  prerequisite_question_id VARCHAR(255) NOT NULL,
  dependency_type VARCHAR(100) NOT NULL DEFAULT 'Direct Prerequisite',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Linked Company Variants
CREATE TABLE IF NOT EXISTS question_company_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  variant_title VARCHAR(255) NOT NULL,
  variant_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Interview Insights & Recruiter Guidance
CREATE TABLE IF NOT EXISTS question_interview_insights (
  question_id VARCHAR(255) PRIMARY KEY,
  why_asked TEXT,
  skills_evaluated JSONB DEFAULT '[]'::jsonb,
  interviewer_followups JSONB DEFAULT '[]'::jsonb,
  candidate_mistakes JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Metadata Version History & Audit Log
CREATE TABLE IF NOT EXISTS question_metadata_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  edited_by VARCHAR(255) NOT NULL,
  snapshot_json JSONB NOT NULL,
  rollback_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Pattern Metadata Confidence
CREATE TABLE IF NOT EXISTS question_confidence (
  question_id VARCHAR(255) PRIMARY KEY,
  confidence_score INTEGER NOT NULL DEFAULT 100,
  needs_manual_review BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Learning Tracks & Roadmaps
CREATE TABLE IF NOT EXISTS learning_tracks (
  track_id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_audience VARCHAR(255) NOT NULL,
  estimated_days INTEGER NOT NULL DEFAULT 30,
  sequence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ultra-fast multi-filter performance
CREATE INDEX IF NOT EXISTS idx_qsol_question ON question_solutions(question_id);
CREATE INDEX IF NOT EXISTS idx_qsol_pattern ON question_solutions(pattern_name);
CREATE INDEX IF NOT EXISTS idx_qtop_question ON question_topics(question_id);
CREATE INDEX IF NOT EXISTS idx_qtop_topic ON question_topics(topic_name);
CREATE INDEX IF NOT EXISTS idx_qtop_subtopic ON question_topics(subtopic_name);
CREATE INDEX IF NOT EXISTS idx_qpat_question ON question_patterns(question_id);
CREATE INDEX IF NOT EXISTS idx_qpat_pattern ON question_patterns(pattern_name);
CREATE INDEX IF NOT EXISTS idx_qcomp_question ON question_companies(question_id);
CREATE INDEX IF NOT EXISTS idx_qcomp_company ON question_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_qcomp_tier ON question_companies(frequency_tier);
CREATE INDEX IF NOT EXISTS idx_qprereq_q ON question_prerequisites(question_id);
CREATE INDEX IF NOT EXISTS idx_qprereq_pre ON question_prerequisites(prerequisite_question_id);

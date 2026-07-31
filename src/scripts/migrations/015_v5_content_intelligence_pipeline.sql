-- =====================================================================================
-- MIGRATION: 015_v5_content_intelligence_pipeline.sql
-- PURPOSE: Schema extensions for the DSA Auto Fix Engine (Content Intelligence Pipeline)
-- Creates the Knowledge Layer (master reference tables), Versioning, and Review Queue.
-- =====================================================================================

-- 1. Master Categories
CREATE TABLE IF NOT EXISTS public.master_dsa_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Master Patterns
CREATE TABLE IF NOT EXISTS public.master_dsa_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_tag VARCHAR(255) REFERENCES public.master_dsa_categories(tag) ON DELETE CASCADE,
    tag VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Master Companies
CREATE TABLE IF NOT EXISTS public.master_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50), -- e.g., FAANG, Tier 1, Tier 2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Master Tags (General topic tags)
CREATE TABLE IF NOT EXISTS public.master_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Master Languages
CREATE TABLE IF NOT EXISTS public.master_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    compilation_command TEXT,
    execution_command TEXT,
    version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Question Versions
CREATE TABLE IF NOT EXISTS public.question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id VARCHAR(255) REFERENCES public.questions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by VARCHAR(255) DEFAULT 'system',
    UNIQUE(question_id, version_number)
);

-- 7. Review Queue (CMS)
CREATE TABLE IF NOT EXISTS public.review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- e.g., 'question'
    entity_id VARCHAR(255) NOT NULL, -- The target question ID
    proposed_payload JSONB NOT NULL,
    changes_summary JSONB NOT NULL, -- Diff or summary of what changed
    confidence_score FLOAT NOT NULL, -- e.g., 98.5
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS Policies
ALTER TABLE public.master_dsa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_dsa_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- Allow public read access to master reference tables
CREATE POLICY "Enable read access for all users on master_dsa_categories" ON public.master_dsa_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on master_dsa_patterns" ON public.master_dsa_patterns FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on master_companies" ON public.master_companies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on master_tags" ON public.master_tags FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on master_languages" ON public.master_languages FOR SELECT USING (true);

-- Allow authenticated reads on versions/queue
CREATE POLICY "Enable read access for authenticated on question_versions" ON public.question_versions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated on review_queue" ON public.review_queue FOR SELECT USING (auth.role() = 'authenticated');

-- Service Role full access (used by the Auto Fix Engine)
CREATE POLICY "Service role full access on master_dsa_categories" ON public.master_dsa_categories USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role full access on master_dsa_patterns" ON public.master_dsa_patterns USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role full access on master_companies" ON public.master_companies USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role full access on master_tags" ON public.master_tags USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role full access on master_languages" ON public.master_languages USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role full access on question_versions" ON public.question_versions USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role full access on review_queue" ON public.review_queue USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

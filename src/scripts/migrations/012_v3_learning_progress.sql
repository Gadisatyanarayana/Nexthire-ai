-- 012_v3_learning_progress.sql
-- V3 Learning Progress Architecture & Persistence

DO $$ BEGIN
  CREATE TYPE content_type_enum AS ENUM (
    'LESSON', 'PRACTICE', 'ASSESSMENT', 'CODING', 'SQL', 
    'MONGODB', 'INTERVIEW', 'SYSTEM_DESIGN', 'VIDEO', 'DOCUMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE learning_status_enum AS ENUM (
    'LOCKED', 'AVAILABLE', 'STARTED', 'IN_PROGRESS', 
    'PAUSED', 'COMPLETED', 'MASTERED', 'REVIEW_REQUIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE xp_source_enum AS ENUM (
    'LESSON_COMPLETE', 'MODULE_COMPLETE', 'DAILY_STREAK', 
    'PRACTICE', 'ASSESSMENT', 'CODING', 'INTERVIEW', 'ADMIN_REWARD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE learning_event_type AS ENUM (
    'lesson_opened', 'lesson_closed', 'lesson_completed', 'lesson_reopened',
    'resume_clicked', 'bookmark_added', 'note_created', 'note_updated',
    'discussion_opened', 'ai_hint_requested', 'ai_explanation_requested',
    'practice_started', 'practice_completed', 'assessment_started',
    'assessment_submitted', 'assessment_passed', 'assessment_failed',
    'code_executed', 'coding_submission', 'coding_accepted', 'coding_failed',
    'sql_executed', 'interview_completed', 'solution_viewed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Universal Progress Tracking
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type content_type_enum NOT NULL,
  content_id TEXT NOT NULL, 
  content_version INTEGER DEFAULT 1,
  status learning_status_enum DEFAULT 'AVAILABLE',
  
  -- Documented Resume State Structure
  resume_state JSONB DEFAULT '{}'::jsonb,
  
  -- Time Tracking
  active_time_seconds INTEGER DEFAULT 0,
  idle_time_seconds INTEGER DEFAULT 0,
  background_time_seconds INTEGER DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, content_type, content_id)
);

DROP TRIGGER IF EXISTS set_learning_progress_updated_at ON learning_progress;
CREATE TRIGGER set_learning_progress_updated_at 
BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Learning Sessions & Analytics
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type content_type_enum NOT NULL,
  content_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  ip_hash TEXT
);

CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type learning_event_type NOT NULL,
  content_type content_type_enum NOT NULL,
  content_id TEXT NOT NULL,
  event_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

DROP TRIGGER IF EXISTS set_daily_activity_updated_at ON daily_activity;
CREATE TRIGGER set_daily_activity_updated_at 
BEFORE UPDATE ON daily_activity FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Gamification (Stats, XP, Achievements)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  ai_metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_user_stats_updated_at ON user_stats;
CREATE TRIGGER set_user_stats_updated_at 
BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source_type xp_source_enum NOT NULL,
  source_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Catalog
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reference Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Critical Indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_learning_progress_content ON learning_progress(content_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_learning_events_user ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_created ON learning_events(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user ON daily_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Base RLS Policies (Users can only see/modify their own data)
DROP POLICY IF EXISTS "Users can view their own learning_progress" ON learning_progress;
CREATE POLICY "Users can view their own learning_progress" ON learning_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own learning_progress" ON learning_progress;
CREATE POLICY "Users can insert their own learning_progress" ON learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own learning_progress" ON learning_progress;
CREATE POLICY "Users can update their own learning_progress" ON learning_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own learning_sessions" ON learning_sessions;
CREATE POLICY "Users can view their own learning_sessions" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own learning_sessions" ON learning_sessions;
CREATE POLICY "Users can insert their own learning_sessions" ON learning_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own learning_sessions" ON learning_sessions;
CREATE POLICY "Users can update their own learning_sessions" ON learning_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own learning_events" ON learning_events;
CREATE POLICY "Users can view their own learning_events" ON learning_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own learning_events" ON learning_events;
CREATE POLICY "Users can insert their own learning_events" ON learning_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own daily_activity" ON daily_activity;
CREATE POLICY "Users can view their own daily_activity" ON daily_activity FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own daily_activity" ON daily_activity;
CREATE POLICY "Users can insert their own daily_activity" ON daily_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own daily_activity" ON daily_activity;
CREATE POLICY "Users can update their own daily_activity" ON daily_activity FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own user_stats" ON user_stats;
CREATE POLICY "Users can view their own user_stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own user_stats" ON user_stats;
CREATE POLICY "Users can insert their own user_stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own user_stats" ON user_stats;
CREATE POLICY "Users can update their own user_stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own xp_transactions" ON xp_transactions;
CREATE POLICY "Users can view their own xp_transactions" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own xp_transactions" ON xp_transactions;
CREATE POLICY "Users can insert their own xp_transactions" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active achievements" ON achievements;
CREATE POLICY "Anyone can view active achievements" ON achievements FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can view their own user_achievements" ON user_achievements;
CREATE POLICY "Users can view their own user_achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own user_achievements" ON user_achievements;
CREATE POLICY "Users can insert their own user_achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

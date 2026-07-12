-- Create mock sessions table
CREATE TABLE IF NOT EXISTS apt_mock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE apt_mock_sessions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own mock sessions"
ON apt_mock_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock sessions"
ON apt_mock_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock sessions"
ON apt_mock_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

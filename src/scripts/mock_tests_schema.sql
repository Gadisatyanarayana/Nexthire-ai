-- Create mock tests table
CREATE TABLE IF NOT EXISTS apt_mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress',
  score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  configuration JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE apt_mock_tests ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own mock tests"
ON apt_mock_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock tests"
ON apt_mock_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock tests"
ON apt_mock_tests FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

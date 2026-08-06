-- Add resume JSON column to users
ALTER TABLE IF NOT EXISTS public.users ADD COLUMN IF NOT EXISTS resume_profile_json jsonb;

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  session_id text NOT NULL UNIQUE,
  current_round text,
  current_score integer,
  current_memory jsonb DEFAULT '{}'::jsonb,
  transcript_summary text,
  resume_profile_json jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new',
  priority text DEFAULT 'normal',
  resolved_by text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

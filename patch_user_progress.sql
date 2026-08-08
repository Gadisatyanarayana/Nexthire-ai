-- patch_user_progress.sql
-- Run this in your Supabase SQL Editor to resolve the missing 'user_progress' table error.

CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  resume_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

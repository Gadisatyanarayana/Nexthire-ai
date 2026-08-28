-- migration_user_progress_user_id.sql
-- Safe backward-compatible migration: Add user_id to user_progress table
-- This lets the table transition from email-only identity to stable user_id identity.
-- Existing rows are preserved and linked by email join.
-- Run in Supabase SQL Editor.

-- Step 1: Add nullable user_id column (safe to run even if it already exists)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Step 2: Backfill user_id from users table where email matches (best-effort)
UPDATE public.user_progress up
SET user_id = u.id
FROM public.users u
WHERE up.email = u.email
  AND up.user_id IS NULL;

-- Step 3: Create a partial index for fast user_id lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
  ON public.user_progress (user_id)
  WHERE user_id IS NOT NULL;

-- Step 4: Keep email column and unique constraint (backward compat)
-- Do NOT drop email column — existing API code still uses it.
-- Future: Once all API routes use user_id, email can be dropped.

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

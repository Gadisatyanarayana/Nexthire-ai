-- patch_rls_fix.sql
-- Fixes the 'new row violates row-level security policy' error for user_progress

-- By default, if RLS is enabled on a table in Supabase but no policies are defined, all inserts are blocked.
-- Since the application uses NextAuth (which doesn't automatically pass JWTs to Supabase RLS) and makes client-side
-- inserts using the anon key, the quickest way to unblock the Resume Builder is to disable RLS for this specific table.

ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;

-- Note: For a production-ready secure environment, you should either:
-- 1. Use Supabase Auth instead of NextAuth.
-- 2. Move the `supabase.from("user_progress").upsert(...)` logic in `page.tsx` into a Next.js Server Action 
--    or API Route (e.g. `/api/resume/save`), where you can verify the NextAuth session and use a 
--    Supabase Service Role Key to safely bypass RLS.

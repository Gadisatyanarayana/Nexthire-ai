-- Reset question bank data while keeping users/contests/auth data.
-- Run in Supabase SQL editor when you want a fresh import.

begin;

-- Remove contest references first.
delete from contest_questions;

-- Remove normalized test case rows.
delete from test_cases;

-- Optional: remove question-linked submissions to avoid stale analytics.
delete from submissions where question_id is not null;

-- Remove all questions.
delete from questions;

-- Optional sync marker cleanup.
delete from app_meta where key like 'questions_%' or key like 'sync_%';

commit;

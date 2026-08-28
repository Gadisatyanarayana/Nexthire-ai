# NextHire AI — Production Deployment Checklist

This document provides a step-by-step production deployment checklist for deploying NextHire AI to production (Vercel, AWS, or custom Node.js server).

---

## 1. Environment Variables Configuration

Ensure the following environment variables are set in your hosting platform (Vercel / Netlify / AWS):

### Core Application & Auth
- `NEXTAUTH_URL`: `https://your-domain.com`
- `NEXTAUTH_SECRET`: Random 32+ character string (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret

### Admin Authorization
- `ADMIN_EMAILS`: `satyanarayanag904@gmail.com`
- `ADMIN_EMAIL`: `satyanarayanag904@gmail.com`

### Database & Supabase (PostgreSQL)
- `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (Server-only)
- `DATABASE_URL`: Connection string for PostgreSQL
- `DIRECT_URL`: Direct database connection string (if using connection pooling)

### AI Services
- `OPENROUTER_API_KEY`: OpenRouter key for Meta-Llama / AI models
- `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`: Google Gemini key for AI features
- `OPENAI_API_KEY`: (Optional) OpenAI API key for fallback models

### Email Services
- `RESEND_API_KEY`: Resend.com API key for onboarding & ticket notifications

---

## 2. Pre-Deployment Verification Steps

### 1. Build Verification
Run standard build checks locally before pushing:
```bash
npx tsc --noEmit
npm run build
```
- Ensure zero TypeScript compiler errors (`npx tsc --noEmit` PASS).
- Ensure Next.js build generates all dynamic and static routes cleanly (`npm run build` PASS).

### 2. Database Schema & RLS Audit
- Execute consolidated migration scripts (`consolidated_schema.sql`, `reasoning_schema_patch.sql`) in Supabase SQL editor.
- Confirm RLS policies on `users`, `submissions`, `user_activity`, `user_progress`, `support_tickets`, `questions`, `test_cases`, `problems`.
- Verify `SUPABASE_SERVICE_ROLE_KEY` is present in production server environment to enable secure server-side mutations.

---

## 3. Production Deployment Execution

### Deploying to Vercel (Recommended)
1. Import repository on [Vercel Dashboard](https://vercel.com).
2. Set Framework Preset: **Next.js**.
3. Add all Environment Variables listed in Section 1.
4. Set Build Command: `npm run build`.
5. Deploy and verify deployment domain.

### Production Smoke Tests (Post-Deploy Checklist)

#### Standard User Flow:
1. Sign in using Google OAuth / NextAuth.
2. Navigate to **Coding Platform** (`/coding`):
   - Verify 6,902+ questions load rapidly.
   - Confirm un-solved questions do NOT falsely show "Solved".
   - Open a coding problem (`/question/[id]`): confirm sample test cases load and run.
   - Execute code and verify Judge response.
3. Navigate to **Resume Builder** (`/resume-builder`):
   - Create a new resume, edit sections, verify debounced autosave ("Saved" badge).
   - Duplicate & Delete resumes.
4. Navigate to **Resume Analyzer** (`/resume-analyzer`):
   - Upload PDF/DOCX/TXT resume and paste Job Description.
   - Verify ATS score calculation, keyword match, and bullet improvements.
   - Refresh page to verify workspace persistence.
5. Verify Support Widget:
   - Confirm Support floating icon appears in bottom-right corner for standard users.

#### Admin Command Center Flow:
1. Log in as Admin (`satyanarayanag904@gmail.com`).
2. Navigate to `/admin`:
   - Confirm Admin Identity Card displays logged-in email, name, and `ROLE: ADMIN` badge.
   - Verify member activity table, feature usage counts, and inbox.
   - Confirm Support floating icon is **hidden** for Admin.
   - Verify `/admin/coding-audit` returns 404 / Not Found.

#### Security Verification:
1. Log out or sign in as a standard non-admin user.
2. Attempt direct navigation to `https://your-domain.com/admin`:
   - Confirm access is denied with "Forbidden" or access restricted message.

---

## 4. Rollback Strategy
If any runtime issue occurs post-deployment:
1. In Vercel Dashboard, select **Deployments** -> select previous working deployment -> click **Promote to Production**.
2. Inspect server logs in Vercel Runtime Logs for error tracebacks.

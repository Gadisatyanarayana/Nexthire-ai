# Deployment Guide
## Vercel Deployment
1. Connect GitHub repository to Vercel.
2. Set Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`.
3. Build Command: `npm run build`
4. Install/Update Database Schema: Execute `database.sql` in Supabase SQL editor.
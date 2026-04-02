# CodeMentor AI 🚀

A premium black & white platform for learning to code with real-time AI feedback.

## Features ✨

- **🔐 Google OAuth Authentication** - Secure login with Google
- **💻 Live Code Editor** - Monaco Editor with multiple language support
- **⚙️ Code Execution** - Run code instantly with Judge0 API
- **🤖 AI Feedback** - Real-time code analysis with OpenRouter
- **📊 Dashboard** - Track progress and recent submissions
- **🎨 Premium UI** - Black & white glassmorphism design

## Tech Stack 🛠

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Auth**: NextAuth.js + Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Code Execution**: Judge0 API
- **AI Analysis**: OpenRouter API (Llama 2)
- **Editor**: Monaco Editor

## Quick Start 🚀

### 1. Clone & Install

```bash
cd my-app
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` with:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# External APIs
JUDGE0_API_KEY=your_judge0_key
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com

OPENROUTER_API_KEY=your_openrouter_key

# Production security (mandatory)
ADMIN_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com
LEETCODE_SYNC_TOKEN=very_long_random_secret

# Optional heavy-traffic controls (recommended in production)
UPSTASH_REDIS_REST_URL=https://your-upstash-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 2.1 Mandatory Security For Production

Before deploying publicly, ensure all of the following are configured:

1. `NEXTAUTH_SECRET` is set to a strong random value.
2. `ADMIN_EMAILS` is set to a comma-separated allowlist for `/admin` access.
3. `LEETCODE_SYNC_TOKEN` is set (sync endpoint is locked in production without it).
4. Deploy only over HTTPS.
5. Use distinct environment variables per environment (dev/staging/prod).

The app middleware now enforces:

1. Authentication on protected pages and sensitive API routes.
2. Admin-only gating for `/admin` using `ADMIN_EMAILS`.
3. Security headers: HSTS (prod), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP.

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL from `database.sql` in the SQL editor
4. Copy your URL and Anon Key to `.env.local`

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URL: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### 5. Get API Keys

- **Judge0**: Sign up at [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0)
- **OpenRouter**: Get free key at [openrouter.io](https://openrouter.io)

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 7. Load Test (Heavy Traffic Baseline)

Use the built-in script to stress-test a route locally:

```bash
npm run perf:load -- --base http://localhost:3000 --endpoint /api/questions?page=1\&limit=50 --concurrency 40 --duration 20
```

Quick health endpoint benchmark:

```bash
npm run perf:load -- --endpoint /api/health --concurrency 60 --duration 20
```

## Project Structure 📁

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth config
│   │   ├── execute/                # Judge0 execution
│   │   └── ai-feedback/           # OpenRouter AI
│   ├── auth/signin/                # Login page
│   ├── dashboard/                  # User dashboard
│   ├── editor/                     # Code editor
│   └── page.tsx                    # Home page
├── components/
│   ├── Button.tsx                  # Reusable button
│   ├── GlassCard.tsx               # Glass card component
│   └── Navbar.tsx                  # Navigation bar
└── lib/
    └── supabase.ts                 # Supabase client
```

## Deployment 🚀

### Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the project
4. Add all environment variables
5. Deploy

```bash
git push origin main
# Then deploy via Vercel dashboard
```

## Features Implemented ✅

- [x] Google OAuth login
- [x] Supabase user storage
- [x] Code editor with Monaco
- [x] Multi-language support (JavaScript, Python, C++, Java)
- [x] Code execution with Judge0
- [x] AI feedback with OpenRouter
- [x] Dashboard with stats
- [x] Premium glassmorphism UI
- [x] Responsive design

## Next Features 🔮

- Problem difficulty levels
- Leaderboard system
- Submission history
- Code snippets library
- Progress tracking
- Achievement badges

## Troubleshooting 🔧

### `NEXTAUTH_SECRET not set`
Run: `openssl rand -base64 32` and add to `.env.local`

### `Supabase connection failed`
- Check `.env.local` has correct URL and key
- Make sure tables are created (run database.sql)

### `Judge0 API errors`
- Verify API key in `.env.local`
- Check the base URL is correct
- Some languages may not be supported

### `Monaco Editor not loading`
- Clear node_modules: `rm -rf node_modules && npm install`
- Restart dev server

## Support & Contributing 💬

For issues, check:
1. `.env.local` has all required variables
2. Supabase tables are created
3. Google OAuth credentials are correct
4. API keys are active

---

**Built with ❤️ for developers**

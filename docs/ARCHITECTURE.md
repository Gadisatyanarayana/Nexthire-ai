# Architecture Overview
NextHire AI employs a highly decoupled Next.js (App Router) architecture with React Server Components (RSC) and Client Components.
- **Frontend**: Next.js 14+, Tailwind CSS, Zustand, Framer Motion, @xyflow/react
- **Backend**: Next.js API Routes (Edge & Node runtime), Supabase (PostgreSQL with RLS)
- **AI Integration**: Hybrid LLM Router (Groq + OpenRouter) via SafeLLMClient.
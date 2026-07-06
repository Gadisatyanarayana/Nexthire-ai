This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Health Check

Use the built-in endpoint to verify server health quickly:

```bash
curl http://localhost:3000/api/health
```

Or run the local script:

```bash
npm run health:check
```

If the browser tab keeps loading, run `npm run health:check` first to confirm whether the app server is actually responding.

## Self-Hosted Judge

Code execution is now fully self-hosted (no external Judge API dependency).

1. Start Redis + judge worker:

```bash
docker compose -f docker-compose.judge.yml up --build
```

2. Start the app:

```bash
npm run dev
```

3. API endpoints:

- `POST /api/run`
- `POST /api/submit`
- `GET /api/result/{submission_id}`

Detailed architecture and setup: `docs/self-hosted-judge.md`

## Performance And Scaling

The app now uses cache-first loading for the hot question routes and a live database readiness probe.

Recommended operating model:

1. Put the app behind a load balancer or reverse proxy and keep the Next.js app stateless.
2. Use Redis for shared cache and queue state, with short TTLs so data stays fresh without hammering Postgres.
3. Scale the app horizontally as multiple instances; the hot question endpoints are cacheable and safe to serve from more than one node.
4. Keep Redis memory bounded with `maxmemory` and `allkeys-lfu` so hot keys survive while cold keys are evicted automatically.
5. Prefer server-cached question list/detail rendering while keeping code editing, execution, and submission interactions client-side.

Recommended starting values:

```bash
APP_CACHE_TTL_SECONDS=120
REDIS_MAXMEMORY=256mb
REDIS_MAXMEMORY_POLICY=allkeys-lfu
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

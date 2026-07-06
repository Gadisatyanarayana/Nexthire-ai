# Self-Hosted Judge Architecture

## Overview

This project now runs code execution fully self-hosted with no external code execution API.

Flow:

1. Frontend calls backend API (`POST /api/run` or `POST /api/submit`)
2. API enqueues a job in Redis/BullMQ
3. Judge worker consumes the job
4. Worker executes code in an isolated Docker container per testcase
5. Worker stores result in Redis (`queued/running/completed/failed`)
6. Frontend/backend can fetch status via `GET /api/result/{submission_id}`

## Scaling Model

The judge and app are designed to scale independently:

- The app server stays stateless and can run multiple instances behind a load balancer.
- Redis stores queue state, submission results, and shared cache entries.
- Workers should be CPU- and memory-bounded so density stays predictable.
- Keep database reads cacheable and versioned so new instances do not stampede Supabase on startup.

## Security Controls

Each execution is sandboxed with Docker constraints:

- Network disabled: `--network none`
- Memory cap: `--memory <limit>`
- CPU cap: `--cpus <limit>`
- PID cap: `--pids-limit <limit>`
- Reduced privileges: `--cap-drop ALL`, `--security-opt no-new-privileges`
- Read-only root filesystem: `--read-only`
- In-container time limit enforced with configurable runtime budget
- Startup buffer + retry handling for cold Docker environments
- Container destroyed after execution (`--rm` + forced cleanup on timeout)

## Redis Memory Policy

For smaller self-hosted deployments, a good starting point is:

```bash
--maxmemory 256mb
--maxmemory-policy allkeys-lfu
```

This keeps Redis focused on hot queue/result/cache keys and reduces memory pressure when question traffic spikes.

## Supported Languages

Current built-in runtimes:

- JavaScript (`node`)
- Python 3.10
- C++ (`g++`)
- Java 17 (`javac` + `java`)

Language ids used by API:

- `1` => javascript
- `2` => python
- `3` => cpp
- `4` => java

## API Endpoints

### POST /api/run

Runs code against visible/custom testcases or raw stdin.

Request examples:

```json
{
  "code": "print('hello')",
  "language": "python",
  "stdin": ""
}
```

```json
{
  "code": "class Solution: ...",
  "language": "python",
  "problem_id": "two-sum",
  "wait": false
}
```

### POST /api/submit

Runs code against all testcase sets (visible + hidden).

```json
{
  "problem_id": "two-sum",
  "code": "class Solution: ...",
  "language_id": 2
}
```

### GET /api/result/{submission_id}

Returns queue/result state:

```json
{
  "submissionId": "uuid",
  "state": "completed",
  "updatedAt": 1710000000000,
  "data": {
    "result": "Accepted"
  }
}
```

## Response Shape (Submit)

`POST /api/submit` returns:

```json
{
  "submission_id": "uuid",
  "result": "Accepted",
  "status": "Accepted",
  "passed": 10,
  "total": 10,
  "runtime": "34 ms",
  "memory": "0.00 MB",
  "runtime_ms": 34,
  "memory_kb": null,
  "assessment": {
    "sample": { "total": 3, "passed": 3, "failed": 0 },
    "hidden": { "total": 20, "passed": 20, "failed": 0 }
  }
}

## Testcase Policy

Production policy targets:

- Visible cases: 2 to 3
- Hidden cases: 15 to 30
- Hidden cases stay backend-only and are masked in submit responses
```

## Local Setup

1. Install Docker Desktop and ensure Docker CLI works.
2. Copy `.env.example` to `.env.local` and set your project secrets.
3. Start Redis + worker:

```bash
docker compose -f docker-compose.judge.yml up --build
```

4. Start Next.js API/frontend (separate terminal):

```bash
npm run dev

5. Verify judge runtimes (Python, Java, C++):

```bash
npm run judge:smoke
```

Optional host fallback runtime paths (used when Docker is unavailable):

- `JUDGE_PYTHON_PATH`
- `JUDGE_JAVAC_PATH`
- `JUDGE_JAVA_PATH`
- `JUDGE_GPP_PATH`
```

## Horizontal Scaling

Scale workers for high concurrency:

```bash
docker compose -f docker-compose.judge.yml up --build --scale judge-worker=4
```

Each worker consumes jobs from the shared Redis queue.

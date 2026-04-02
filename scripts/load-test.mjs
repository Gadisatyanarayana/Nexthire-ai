#!/usr/bin/env node

/**
 * Lightweight load test for NextHire APIs.
 * Usage examples:
 *   node scripts/load-test.mjs --base http://localhost:3000 --endpoint /api/health --concurrency 40 --duration 20
 *   node scripts/load-test.mjs --base http://localhost:3000 --endpoint /api/questions?page=1&limit=50 --concurrency 25 --duration 30
 */

function parseArgs(argv) {
  const args = {
    base: process.env.LOAD_TEST_BASE_URL || "http://localhost:3000",
    endpoint: process.env.LOAD_TEST_ENDPOINT || "/api/health",
    method: process.env.LOAD_TEST_METHOD || "GET",
    concurrency: Number(process.env.LOAD_TEST_CONCURRENCY || 20),
    duration: Number(process.env.LOAD_TEST_DURATION || 20),
    timeoutMs: Number(process.env.LOAD_TEST_TIMEOUT_MS || 8000),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value == null) continue;

    if (key === "--base") args.base = value;
    if (key === "--endpoint") args.endpoint = value;
    if (key === "--method") args.method = value.toUpperCase();
    if (key === "--concurrency") args.concurrency = Number(value);
    if (key === "--duration") args.duration = Number(value);
    if (key === "--timeout") args.timeoutMs = Number(value);
  }

  return args;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function run() {
  const cfg = parseArgs(process.argv);
  const url = `${cfg.base.replace(/\/$/, "")}${cfg.endpoint.startsWith("/") ? cfg.endpoint : `/${cfg.endpoint}`}`;
  const stopAt = Date.now() + cfg.duration * 1000;

  let total = 0;
  let success = 0;
  let failed = 0;
  const statusMap = new Map();
  const latencies = [];

  async function worker() {
    while (Date.now() < stopAt) {
      const started = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), cfg.timeoutMs);

      try {
        const response = await fetch(url, {
          method: cfg.method,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const elapsed = Date.now() - started;
        latencies.push(elapsed);
        total += 1;

        const status = response.status;
        statusMap.set(status, (statusMap.get(status) || 0) + 1);

        if (status >= 200 && status < 400) success += 1;
        else failed += 1;
      } catch {
        const elapsed = Date.now() - started;
        latencies.push(elapsed);
        total += 1;
        failed += 1;
        statusMap.set("error", (statusMap.get("error") || 0) + 1);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  console.log(`Starting load test: ${cfg.method} ${url}`);
  console.log(`Concurrency: ${cfg.concurrency} | Duration: ${cfg.duration}s | Timeout: ${cfg.timeoutMs}ms`);

  await Promise.all(Array.from({ length: Math.max(1, cfg.concurrency) }, () => worker()));

  const elapsedSeconds = Math.max(1, cfg.duration);
  const rps = total / elapsedSeconds;

  console.log("\n=== Load Test Summary ===");
  console.log(`Total requests: ${total}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Requests/sec: ${rps.toFixed(2)}`);
  console.log(`Latency p50: ${percentile(latencies, 50)} ms`);
  console.log(`Latency p95: ${percentile(latencies, 95)} ms`);
  console.log(`Latency p99: ${percentile(latencies, 99)} ms`);
  console.log("Status distribution:");

  for (const [status, count] of statusMap.entries()) {
    console.log(`  ${status}: ${count}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Load test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

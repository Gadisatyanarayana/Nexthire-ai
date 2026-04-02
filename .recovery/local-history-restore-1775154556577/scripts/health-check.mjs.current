const baseUrl = process.env.HEALTH_CHECK_URL || "http://localhost:3000";
const target = `${baseUrl.replace(/\/$/, "")}/api/health`;

async function run() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const start = Date.now();
    const response = await fetch(target, { signal: controller.signal, cache: "no-store" });
    const elapsedMs = Date.now() - start;
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[health-check] FAIL ${response.status} ${response.statusText} (${elapsedMs}ms)`);
      console.error(body);
      process.exit(1);
    }

    console.log(`[health-check] OK ${response.status} (${elapsedMs}ms)`);
    console.log(JSON.stringify(body, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[health-check] FAIL request error: ${message}`);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

run();

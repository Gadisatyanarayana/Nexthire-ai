import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const TARGET_VISIBLE = 2;
const TARGET_HIDDEN = 20;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableErrorMessage(message) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("fetch failed") ||
    text.includes("etimedout") ||
    text.includes("econnreset") ||
    text.includes("enotfound") ||
    text.includes("gateway") ||
    text.includes("timeout")
  );
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function withRetryResult(label, fn, attempts = 4) {
  let lastResult = null;
  for (let i = 1; i <= attempts; i += 1) {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${label} timeout`)), 25000);
      }),
    ]);
    lastResult = result;

    const message = result?.error?.message;
    if (!message) {
      return result;
    }

    if (!isRetryableErrorMessage(message) || i === attempts) {
      return result;
    }

    const delayMs = Math.min(3000, 300 * 2 ** (i - 1));
    console.warn(`${label} retry ${i}/${attempts - 1} after response error: ${message}`);
    await sleep(delayMs);
  }

  return lastResult;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

function loadEnv() {
  const root = process.cwd();
  return {
    ...readEnvFile(path.join(root, ".env.example")),
    ...readEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };
}

function normalizeDifficulty(input) {
  const x = String(input || "Easy").trim().toLowerCase();
  if (x === "medium") return "Medium";
  if (x === "hard") return "Hard";
  return "Easy";
}

function defaultTimeLimitMinutes(difficulty) {
  if (difficulty === "Medium") return 30;
  if (difficulty === "Hard") return 45;
  return 20;
}

function parseCaseRows(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const row = entry || {};
      const input = String(row.input ?? "").trim();
      const expectedOutput = String(row.expectedOutput ?? row.expected_output ?? row.output ?? "").trim();
      if (!input || !expectedOutput) return null;
      return { input, expectedOutput };
    })
    .filter(Boolean);
}

function dedupeRows(rows) {
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.input}@@${row.expectedOutput}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function fillToCount(seed, count) {
  const base = dedupeRows(seed);
  if (!base.length || count <= 0) return [];
  const out = [...base];
  let i = 0;
  while (out.length < count) {
    const x = base[i % base.length];
    out.push({ input: x.input, expectedOutput: x.expectedOutput });
    i += 1;
  }
  return out.slice(0, count);
}

async function main() {
  const argv = new Set(process.argv.slice(2));
  const dryRun = argv.has("--dry-run");
  const limitArg = process.argv.find((x) => x.startsWith("--limit="));
  const offsetArg = process.argv.find((x) => x.startsWith("--offset="));
  const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1] || "0")) : 1000;
  const offset = offsetArg ? Math.max(0, Number(offsetArg.split("=")[1] || "0")) : 0;

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (resource, options) => fetchWithTimeout(resource, options, 20000),
    },
  });

  console.log("Fetching questions from database in batches of 1000...");
  const rawRows = [];
  let currentOffset = offset;
  const batchSize = 1000;

  while (true) {
    console.log(`Loading questions from range [${currentOffset}, ${currentOffset + batchSize - 1}]...`);
    const { data: batch, error } = await withRetryResult(`questions load range [${currentOffset}]`, async () =>
      supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: true })
        .range(currentOffset, currentOffset + batchSize - 1)
    );

    if (error) throw new Error(`questions load failed: ${error.message}`);
    if (!batch || batch.length === 0) break;

    rawRows.push(...batch);
    if (batch.length < batchSize) break;
    currentOffset += batchSize;

    if (limitArg && rawRows.length >= limit) {
      break;
    }
  }

  const rows = limitArg ? rawRows.slice(0, limit) : rawRows;

  if (rows.length === 0) {
    console.log("No questions found in database.");
    return;
  }

  const columns = Object.keys(rows[0]);
  const hasSampleTestCases = columns.includes("sample_test_cases");
  const hasHiddenTestCases = columns.includes("hidden_test_cases");
  const hasTimeLimit = columns.includes("time_limit_minutes");
  
  console.log(`\nDatabase schema detection:`);
  console.log(`- sample_test_cases exists: ${hasSampleTestCases}`);
  console.log(`- hidden_test_cases exists: ${hasHiddenTestCases}`);
  console.log(`- time_limit_minutes exists: ${hasTimeLimit}`);
  console.log(`\nFound ${rows.length} questions. Mode: ${dryRun ? "dry-run" : "write"}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const pendingUpdates = [];

  for (let i = 0; i < rows.length; i += 1) {
    const q = rows[i];
    const difficulty = normalizeDifficulty(q.difficulty);

    try {
      const existingVisible = hasSampleTestCases ? parseCaseRows(q.sample_test_cases) : [];
      const existingHidden = hasHiddenTestCases ? parseCaseRows(q.hidden_test_cases) : [];
      const legacy = parseCaseRows(q.testcases);

      const visibleSeed = existingVisible.length ? existingVisible : legacy.slice(0, TARGET_VISIBLE);
      const visibleFallback = existingHidden.length ? existingHidden : legacy;
      const visible = fillToCount(visibleSeed.length ? visibleSeed : visibleFallback, TARGET_VISIBLE);

      const hiddenSeed = existingHidden.length
        ? existingHidden
        : legacy.slice(TARGET_VISIBLE).length
          ? legacy.slice(TARGET_VISIBLE)
          : legacy.length
            ? legacy
            : visible;
      const hidden = fillToCount(hiddenSeed.length ? hiddenSeed : visible, TARGET_HIDDEN);

      if (visible.length === 0 && hidden.length === 0) {
        console.warn(`Skipping question ${q.id}: No seed testcases available.`);
        failed += 1;
        continue;
      }

      const nextTestcases = [...visible, ...hidden];
      const targetTimeLimit = defaultTimeLimitMinutes(difficulty);
      
      const alreadyCompliant =
        (!hasSampleTestCases || existingVisible.length === TARGET_VISIBLE) &&
        (!hasHiddenTestCases || existingHidden.length === TARGET_HIDDEN) &&
        legacy.length === nextTestcases.length &&
        (!hasTimeLimit || Number(q.time_limit_minutes || 0) === targetTimeLimit);

      if (alreadyCompliant) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        const payload = {
          id: q.id,
          title: q.title || q.id || "Untitled",
          difficulty: difficulty,
          description: q.description || `Solve ${q.title || q.id}.`,
          topic: Array.isArray(q.topic) ? q.topic : [],
          testcases: nextTestcases,
        };

        if (hasSampleTestCases) payload.sample_test_cases = visible;
        if (hasHiddenTestCases) payload.hidden_test_cases = hidden;
        if (hasTimeLimit) payload.time_limit_minutes = targetTimeLimit;

        pendingUpdates.push(payload);
      }

      updated += 1;
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to process question ${q.id}: ${msg}`);
    }
  }

  if (!dryRun && pendingUpdates.length > 0) {
    console.log(`Writing ${pendingUpdates.length} updates in chunks of 50...`);
    const chunkSize = 50;
    for (let i = 0; i < pendingUpdates.length; i += chunkSize) {
      const chunk = pendingUpdates.slice(i, i + chunkSize);
      const { error: upsertError } = await withRetryResult("questions bulk upsert", async () =>
        supabase.from("questions").upsert(chunk, { onConflict: "id" })
      );

      if (upsertError) {
        failed += chunk.length;
        console.error(`questions bulk upsert failed: ${upsertError.message}`);
        break;
      }
      
      console.log(`Updated chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(pendingUpdates.length / chunkSize)}`);
    }
  }

  console.log(`\nRun Summary:`);
  console.log(JSON.stringify({ total: rows.length, updated, skipped, failed, dryRun }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

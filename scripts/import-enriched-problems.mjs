import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function loadEnv() {
  const root = process.cwd();
  const local = readDotEnvFile(path.join(root, ".env.local"));
  const example = readDotEnvFile(path.join(root, ".env.example"));
  return { ...example, ...local, ...process.env };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    input: "scripts/data/enriched-problems.json",
    clearCodeforces: false,
    dryRun: false,
    statsOnly: false,
  };

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const next = args[i + 1];
    if (key === "--input" && next) {
      out.input = next;
      i += 1;
      continue;
    }
    if (key === "--clear-codeforces") {
      out.clearCodeforces = true;
      continue;
    }
    if (key === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (key === "--stats-only") {
      out.statsOnly = true;
      continue;
    }
  }

  return out;
}

function normalizeDifficulty(value) {
  const x = String(value || "").toLowerCase();
  if (x === "easy") return "Easy";
  if (x === "hard") return "Hard";
  return "Medium";
}

function normalizeTag(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toQuestionRow(raw) {
  const q = raw?.question || raw;
  const id = String(q?.id || "").trim();
  const title = String(q?.title || "").trim();
  const description = String(q?.description || "").trim();

  if (!id || !title || !description) return null;

  const examples = Array.isArray(q?.examples)
    ? q.examples
        .map((ex) => ({
          input: String(ex?.input || "").trim(),
          output: String(ex?.output || "").trim(),
          explanation: ex?.explanation ? String(ex.explanation).trim() : undefined,
        }))
        .filter((ex) => ex.input && ex.output)
        .slice(0, 6)
    : [];

  const testcases = Array.isArray(q?.testcases)
    ? q.testcases
        .map((tc) => ({
          input: String(tc?.input || "").trim(),
          expectedOutput: String(tc?.expectedOutput || tc?.output || "").trim(),
        }))
        .filter((tc) => tc.input && tc.expectedOutput)
        .slice(0, 20)
    : [];

  const topic = Array.from(
    new Set((Array.isArray(q?.topic) ? q.topic : []).map((t) => normalizeTag(t)).filter(Boolean))
  ).slice(0, 20);

  return {
    id,
    slug: id,
    title,
    difficulty: normalizeDifficulty(q?.difficulty),
    function_name: q?.function_name ? String(q.function_name) : "solve",
    input_type: q?.input_type ? String(q.input_type) : "structured",
    output_type: q?.output_type ? String(q.output_type) : "structured",
    topic,
    company_tags: Array.isArray(q?.company_tags) ? q.company_tags.map((x) => String(x)).slice(0, 50) : [],
    pattern_tags: Array.isArray(q?.pattern_tags) ? q.pattern_tags.map((x) => String(x)).slice(0, 50) : [],
    acceptance_rate: Number(q?.acceptance_rate || 0),
    description,
    source: q?.source ? String(q.source) : "ai-enriched",
    examples,
    testcases,
    starter_code: q?.starter_code && typeof q.starter_code === "object"
      ? q.starter_code
      : {
          cpp: "auto solve() {\n    // Write your logic here.\n}",
          java: "Object solve() {\n    // Write your logic here.\n    return null;\n}",
          python: "def solve():\n    # Write your logic here\n    return None\n",
        },
  };
}

async function main() {
  const args = parseArgs();
  const env = loadEnv();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (args.statsOnly) {
    const total = await supabase.from("questions").select("id", { count: "exact", head: true });
    const codeforces = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "codeforces");
    const aiEnriched = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "ai_enriched");
    const missingTc = await supabase.from("questions").select("id", { count: "exact", head: true }).is("test_cases", null);

    console.log(JSON.stringify({
      totalQuestions: total.count ?? null,
      codeforcesQuestions: codeforces.count ?? null,
      aiEnrichedQuestions: aiEnriched.count ?? null,
      questionsMissingTestcases: missingTc.count ?? null,
    }, null, 2));
    return;
  }

  const inputPath = path.isAbsolute(args.input) ? args.input : path.join(process.cwd(), args.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const rowsRaw = Array.isArray(parsed?.rows) ? parsed.rows : Array.isArray(parsed) ? parsed : [];
  const rows = rowsRaw.map(toQuestionRow).filter(Boolean);

  if (rows.length === 0) {
    throw new Error("No valid question rows found in input file.");
  }

  console.log(`Input rows: ${rowsRaw.length}, valid rows: ${rows.length}`);

  if (args.dryRun) {
    console.log("Dry run enabled. No DB write performed.");
    return;
  }

  if (args.clearCodeforces) {
    console.log("Clearing existing Codeforces rows...");
    const del = await supabase.from("questions").delete().eq("source", "codeforces");
    if (del.error) throw new Error(`Failed to clear Codeforces rows: ${del.error.message}`);
  }

  const chunkSize = 200;
  let done = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const upsert = await supabase.from("questions").upsert(chunk, { onConflict: "id" });
    if (upsert.error) {
      throw new Error(`Upsert failed at chunk ${Math.floor(i / chunkSize) + 1}: ${upsert.error.message}`);
    }
    done += chunk.length;
    console.log(`Upserted ${done}/${rows.length}`);
  }

  const syncedAt = new Date().toISOString();
  await supabase.from("app_meta").upsert(
    { key: "questions_last_sync_at", value: syncedAt, updated_at: syncedAt },
    { onConflict: "key" }
  );

  console.log(`Import complete. Total upserted: ${done}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});

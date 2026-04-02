#!/usr/bin/env node
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
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

function loadEnv() {
  const root = process.cwd();
  return {
    ...readDotEnvFile(path.join(root, ".env.example")),
    ...readDotEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };
}

function isComplete(q) {
  const difficulty = String(q?.difficulty || "").toLowerCase();
  const hasDifficulty = ["easy", "medium", "hard"].includes(difficulty);
  const hasTopic = Array.isArray(q?.topic) && q.topic.length > 0;
  const hasDescription = String(q?.description || "").trim().length >= 80;
  const testcases = Array.isArray(q?.testcases) ? q.testcases : [];
  const hasTests = testcases.some((tc) => String(tc?.input || "").trim() && String(tc?.expectedOutput || "").trim());
  return hasDifficulty && hasTopic && hasDescription && hasTests;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase envs");

  const supabase = createClient(url, key);
  const dryRun = process.argv.includes("--dry-run");

  const { data, error } = await supabase.from("questions").select("id, difficulty, topic, description, testcases");
  if (error) throw new Error(error.message);

  const rows = Array.isArray(data) ? data : [];
  const toDelete = rows.filter((q) => !isComplete(q)).map((q) => q.id).filter(Boolean);

  console.log(`Total questions: ${rows.length}`);
  console.log(`Incomplete questions: ${toDelete.length}`);

  if (dryRun || toDelete.length === 0) {
    console.log(dryRun ? "Dry run only. No records deleted." : "Nothing to delete.");
    return;
  }

  const chunk = 200;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunk) {
    const ids = toDelete.slice(i, i + chunk);
    const { error: delError } = await supabase.from("questions").delete().in("id", ids);
    if (delError) {
      console.error(`Delete chunk failed at ${i}: ${delError.message}`);
      continue;
    }
    deleted += ids.length;
    console.log(`Deleted ${deleted}/${toDelete.length}`);
  }

  console.log(`Done. Deleted ${deleted} incomplete questions.`);
}

main().catch((e) => {
  console.error("Purge failed:", e.message || e);
  process.exit(1);
});

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
  const localEnv = readDotEnvFile(path.join(root, ".env.local"));
  const exampleEnv = readDotEnvFile(path.join(root, ".env.example"));
  return { ...exampleEnv, ...localEnv, ...process.env };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  console.log("Resetting question bank...");

  const { error: cqErr } = await supabase.from("contest_questions").delete().not("id", "is", null);
  if (cqErr) throw cqErr;

  const { error: tcErr } = await supabase.from("test_cases").delete().not("id", "is", null);
  if (tcErr) throw tcErr;

  const { error: subErr } = await supabase.from("submissions").delete().not("question_id", "is", null);
  if (subErr) throw subErr;

  const { error: qErr } = await supabase.from("questions").delete().not("id", "is", null);
  if (qErr) throw qErr;

  const { error: metaErr } = await supabase
    .from("app_meta")
    .delete()
    .or("key.like.questions_%,key.like.sync_%");
  if (metaErr) throw metaErr;

  console.log("Question bank reset complete.");
}

main().catch((err) => {
  console.error("Reset failed:", err.message || err);
  process.exit(1);
});

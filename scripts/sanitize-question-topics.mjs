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

function normalizeTag(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function cleanTopics(raw) {
  const blocked = new Set([
    "leetcode",
    "leet-code",
    "solving",
    "problem-solving",
    "problem",
    "problems",
    "question",
    "questions",
    "dsa",
    "practice",
  ]);

  return Array.from(
    new Set(
      (Array.isArray(raw) ? raw : [])
        .map((t) => normalizeTag(t))
        .filter(Boolean)
        .filter((t) => !blocked.has(t))
    )
  ).slice(0, 12);
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");

  const supabase = createClient(url, key);

  const { data, error } = await supabase.from("questions").select("id, topic");
  if (error) throw new Error(error.message);

  const rows = Array.isArray(data) ? data : [];
  let updated = 0;

  for (const row of rows) {
    const next = cleanTopics(row.topic);
    const prev = Array.isArray(row.topic) ? row.topic.map((x) => String(x)) : [];

    if (JSON.stringify(prev) === JSON.stringify(next)) continue;

    const { error: updateError } = await supabase
      .from("questions")
      .update({ topic: next })
      .eq("id", row.id);

    if (!updateError) updated += 1;
  }

  console.log(`Processed: ${rows.length}`);
  console.log(`Updated topics: ${updated}`);
}

main().catch((e) => {
  console.error("Topic sanitize failed:", e.message || e);
  process.exit(1);
});

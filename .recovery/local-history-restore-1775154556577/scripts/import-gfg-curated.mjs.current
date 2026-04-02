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

function starterCode() {
  return {
    cpp: "auto solve() {\n    // Implement solution\n}",
    java: "Object solve() {\n    // Implement solution\n    return null;\n}",
    python: "def solve():\n    # Implement solution\n    return None\n",
  };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const jsonPath = path.join(process.cwd(), "scripts", "data", "gfg-curated.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Missing curated dataset: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const dataset = JSON.parse(raw);
  if (!Array.isArray(dataset)) {
    throw new Error("gfg-curated.json must be an array");
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  const payload = dataset.map((q) => ({
    id: String(q.id || "").trim(),
    title: String(q.title || "").trim(),
    slug: String(q.id || "").trim(),
    difficulty: String(q.difficulty || "Medium").trim(),
    function_name: "solve",
    input_type: "auto",
    output_type: "auto",
    topic: Array.isArray(q.topic) ? q.topic.map(String).filter(Boolean) : [],
    acceptance_rate: 0,
    description: String(q.description || "").trim(),
    examples: Array.isArray(q.examples) ? q.examples : [],
    testcases: Array.isArray(q.testcases) ? q.testcases : [],
    starter_code: starterCode(),
    source: "gfg-curated",
    company_tags: ["student-focus", "recruiter-focus"],
    pattern_tags: ["gfg-curated"],
  }));

  const invalid = payload.filter((q) => !q.id || !q.title || !q.description);
  if (invalid.length > 0) {
    throw new Error(`Invalid records in curated dataset: ${invalid.length}`);
  }

  const { error } = await supabase.from("questions").upsert(payload, { onConflict: "id" });
  if (error) {
    throw new Error(`GFG import failed: ${error.message}`);
  }

  console.log(`GFG curated import complete: ${payload.length} questions.`);
}

main().catch((err) => {
  console.error("GFG import failed:", err.message || err);
  process.exit(1);
});

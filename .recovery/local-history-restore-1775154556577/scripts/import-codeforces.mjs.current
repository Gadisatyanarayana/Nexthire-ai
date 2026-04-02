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

function safeSlug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toDifficulty(rating) {
  if (!Number.isFinite(rating)) return "Medium";
  if (rating < 1200) return "Easy";
  if (rating < 1800) return "Medium";
  return "Hard";
}

function starterCode() {
  return {
    cpp: "auto solve() {\n    // Implement solution\n}",
    java: "Object solve() {\n    // Implement solution\n    return null;\n}",
    python: "def solve():\n    # Implement solution\n    return None\n",
  };
}

function buildQuestion(problem) {
  const contestId = String(problem.contestId || "").trim();
  const index = String(problem.index || "").trim();
  const title = String(problem.name || "").trim();
  const rating = Number(problem.rating || 0);
  const tags = Array.isArray(problem.tags) ? problem.tags.filter(Boolean).map(String) : [];
  const id = `cf-${contestId}-${index}`;
  const slug = safeSlug(`${title}-${contestId}-${index}`);
  const difficulty = toDifficulty(rating);

  const examples = [
    {
      input: "Refer to Codeforces statement sample input",
      output: "Refer to Codeforces statement sample output",
      explanation: "Open the source URL for exact samples and constraints.",
    },
  ];

  const testcases = [
    {
      input: "Refer to source",
      expectedOutput: "Refer to source",
    },
  ];

  return {
    id,
    title,
    slug,
    difficulty,
    function_name: "solve",
    input_type: "auto",
    output_type: "auto",
    topic: tags.length > 0 ? tags : ["codeforces"],
    acceptance_rate: 0,
    description: [
      `Codeforces Problem: ${title}`,
      "This problem was imported from the Codeforces public problemset API.",
      "Use the source URL to read full statement, constraints, and real samples.",
      `Source URL: https://codeforces.com/problemset/problem/${contestId}/${index}`,
    ].join("\n\n"),
    examples,
    testcases,
    starter_code: starterCode(),
    source: "codeforces",
    company_tags: rating >= 1600 ? ["recruiter-focus"] : ["student-focus"],
    pattern_tags: ["competitive-programming", difficulty.toLowerCase()],
  };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const limit = Number(process.env.CF_IMPORT_LIMIT || 300);
  const supabase = createClient(supabaseUrl, serviceRole);

  console.log(`Fetching Codeforces problemset (limit=${limit})...`);
  const res = await fetch("https://codeforces.com/api/problemset.problems");
  if (!res.ok) {
    throw new Error(`Codeforces API failed with status ${res.status}`);
  }

  const data = await res.json();
  const problems = Array.isArray(data?.result?.problems) ? data.result.problems.slice(0, limit) : [];

  const payload = problems
    .map(buildQuestion)
    .filter((q) => q.title && q.id && q.slug);

  if (payload.length === 0) {
    console.log("No valid Codeforces questions to import.");
    return;
  }

  const batchSize = 50;
  let done = 0;

  for (let i = 0; i < payload.length; i += batchSize) {
    const batch = payload.slice(i, i + batchSize);
    const { error } = await supabase.from("questions").upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Upsert failed at batch ${i / batchSize + 1}: ${error.message}`);
    }
    done += batch.length;
    console.log(`Imported ${done}/${payload.length}`);
  }

  console.log(`Codeforces import complete: ${done} questions.`);
}

main().catch((err) => {
  console.error("Codeforces import failed:", err.message || err);
  process.exit(1);
});

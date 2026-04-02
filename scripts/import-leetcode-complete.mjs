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
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function loadEnv() {
  const root = process.cwd();
  const fromLocal = readDotEnvFile(path.join(root, ".env.local"));
  const fromExample = readDotEnvFile(path.join(root, ".env.example"));
  return { ...fromExample, ...fromLocal, ...process.env };
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseExamplesFromText(text) {
  const examples = [];
  const blocks = String(text || "").split(/\bExample\s*\d*\s*:/i).slice(1);

  for (const block of blocks) {
    const inputMatch = block.match(/Input\s*:\s*([\s\S]*?)(?:\n|\r|Output\s*:)/i);
    const outputMatch = block.match(/Output\s*:\s*([\s\S]*?)(?:\n|\r|Explanation\s*:|$)/i);
    const explanationMatch = block.match(/Explanation\s*:\s*([\s\S]*?)(?:\n\s*Example\s*\d*\s*:|$)/i);

    const input = inputMatch?.[1]?.trim() || "";
    const output = outputMatch?.[1]?.trim() || "";
    const explanation = explanationMatch?.[1]?.trim() || "";

    if (input && output) {
      examples.push({ input, output, explanation: explanation || undefined });
    }
  }

  return examples.slice(0, 6);
}

function makeQuestionPayload(q) {
  const title = String(q.title || "").trim();
  const slug = String(q.titleSlug || "").trim().toLowerCase();
  const difficulty = String(q.difficulty || "").trim();
  const topic = Array.isArray(q.topicTags) ? q.topicTags.map((t) => String(t.name || "").trim()).filter(Boolean) : [];
  const description = stripHtml(q.content || "");
  const examples = parseExamplesFromText(description);
  const testcases = examples.map((ex) => ({ input: ex.input, expectedOutput: ex.output }));

  if (!title || !slug) return null;
  if (!["Easy", "Medium", "Hard"].includes(difficulty)) return null;
  if (topic.length === 0) return null;
  if (description.length < 80) return null;
  if (testcases.length === 0) return null;

  let starter = { cpp: "", java: "", python: "" };
  try {
    const defs = JSON.parse(String(q.codeDefinition || "[]"));
    if (Array.isArray(defs)) {
      for (const def of defs) {
        const lang = String(def?.value || "").toLowerCase();
        const code = String(def?.defaultCode || "");
        if (lang === "cpp") starter.cpp = code;
        if (lang === "java") starter.java = code;
        if (lang === "python" || lang === "python3") starter.python = code;
      }
    }
  } catch {
    starter = {
      cpp: "auto solve() {\n    // Write your logic here\n}",
      java: "Object solve() {\n    return null;\n}",
      python: "def solve():\n    return None\n",
    };
  }

  return {
    id: `lc-full-${slug}`,
    title,
    slug,
    difficulty,
    function_name: "solve",
    input_type: "auto",
    output_type: "auto",
    topic,
    acceptance_rate: Math.round(Number(q.acRate || 0)),
    description,
    examples,
    testcases,
    starter_code: starter,
    source: "leetcode-full",
    company_tags: [],
    pattern_tags: [],
  };
}

async function fetchCatalog(limit) {
  const res = await fetch("https://leetcode.com/api/problems/all/", {
    headers: { "User-Agent": "NextHireAI-Importer" },
  });

  if (!res.ok) {
    throw new Error(`Catalog fetch failed: ${res.status}`);
  }

  const payload = await res.json();
  const pairs = Array.isArray(payload?.stat_status_pairs) ? payload.stat_status_pairs : [];
  return pairs
    .map((x) => ({
      titleSlug: String(x?.stat?.question__title_slug || ""),
      title: String(x?.stat?.question__title || ""),
    }))
    .filter((x) => x.titleSlug)
    .slice(0, limit);
}

async function fetchQuestionDetail(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        titleSlug
        difficulty
        content
        codeDefinition
        topicTags { name }
        stats
      }
    }
  `;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NextHireAI-Importer",
      Referer: "https://leetcode.com/problemset/",
    },
    body: JSON.stringify({ query, variables: { titleSlug } }),
  });

  if (!res.ok) return null;
  const payload = await res.json();
  const q = payload?.data?.question;
  if (!q) return null;

  let acRate = 0;
  try {
    const stats = JSON.parse(String(q.stats || "{}"));
    acRate = Number(stats?.acRate || 0);
  } catch {
    acRate = 0;
  }

  return { ...q, acRate };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const limit = Number(process.env.LEETCODE_IMPORT_LIMIT || 500);
  const batchSize = 20;

  console.log(`Fetching LeetCode catalog (limit=${limit})...`);
  const catalog = await fetchCatalog(limit);
  console.log(`Catalog items: ${catalog.length}`);

  const prepared = [];

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    const detail = await fetchQuestionDetail(item.titleSlug);
    if (!detail) continue;

    const payload = makeQuestionPayload(detail, i + 1);
    if (payload) prepared.push(payload);

    if ((i + 1) % 25 === 0) {
      console.log(`Processed ${i + 1}/${catalog.length}, qualified=${prepared.length}`);
    }

    await new Promise((r) => setTimeout(r, 180));
  }

  console.log(`Qualified complete questions: ${prepared.length}`);

  let inserted = 0;
  for (let i = 0; i < prepared.length; i += batchSize) {
    const batch = prepared.slice(i, i + batchSize);
    const { error } = await supabase.from("questions").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`Upsert batch failed at ${i}: ${error.message}`);
      continue;
    }
    inserted += batch.length;
    console.log(`Upserted ${inserted}/${prepared.length}`);
  }

  console.log(`Done. Inserted/updated ${inserted} high-quality questions.`);
}

main().catch((err) => {
  console.error("Import failed:", err.message || err);
  process.exit(1);
});

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
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

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SHEET_REPOS = [
  "har200105/striverSDESheet",
  "AkashSingh3031/Striver-SDE-Sheet-Challenge",
  "Leet-Us-Code/Striver-Sheets-Resources",
  "abhiiishek07/180DSA",
  "rohits05/Strivers-SDE-Sheet-Challenge",
  "sukanyabag/DSA-and-ProblemSolving",
];

function normalizeTag(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function cleanTopicTags(rawTopics) {
  const blocked = new Set([
    "leetcode",
    "leet-code",
    "solving",
    "problem-solving",
    "dsa",
    "questions",
    "question",
    "practice",
  ]);

  return Array.from(
    new Set(
      (Array.isArray(rawTopics) ? rawTopics : [])
        .map((t) => normalizeTag(t))
        .filter(Boolean)
        .filter((t) => !blocked.has(t))
    )
  ).slice(0, 12);
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
    if (input && output) examples.push({ input, output, explanation: explanation || undefined });
  }
  return examples.slice(0, 8);
}

function parseSheetSlugs(markdown) {
  const map = new Map();
  const lines = String(markdown || "").split(/\r?\n/);
  let currentSection = "dsa-sheet";

  for (const line of lines) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    if (heading?.[1]) {
      currentSection = normalizeTag(heading[1]) || "dsa-sheet";
      continue;
    }

    const regex = /leetcode\.com\/problems\/([a-z0-9-]+)\/?/gi;
    let m;
    while ((m = regex.exec(line)) !== null) {
      const slug = String(m[1] || "").toLowerCase();
      if (!slug) continue;
      const curr = map.get(slug) || new Set();
      curr.add(currentSection);
      map.set(slug, curr);
    }
  }

  return map;
}

async function fetchCatalog(limit) {
  const res = await fetch("https://leetcode.com/api/problems/all/", {
    headers: { "User-Agent": "NextHireAI-Importer" },
  });
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
  const payload = await res.json();
  const pairs = Array.isArray(payload?.stat_status_pairs) ? payload.stat_status_pairs : [];
  return pairs
    .map((x) => String(x?.stat?.question__title_slug || "").toLowerCase())
    .filter(Boolean)
    .slice(0, limit);
}

async function fetchSheetSlugMap() {
  const collected = new Map();
  for (const repo of SHEET_REPOS) {
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${repo}/readme`, {
        headers: {
          "User-Agent": "NextHireAI-Importer",
          Accept: "application/vnd.github+json",
        },
      });
      if (!readmeRes.ok) continue;
      const readmeMeta = await readmeRes.json();
      const downloadUrl = String(readmeMeta?.download_url || "");
      if (!downloadUrl) continue;

      const textRes = await fetch(downloadUrl, { headers: { "User-Agent": "NextHireAI-Importer" } });
      if (!textRes.ok) continue;
      const text = await textRes.text();
      const parsed = parseSheetSlugs(text);
      for (const [slug, tags] of parsed.entries()) {
        const curr = collected.get(slug) || new Set();
        curr.add("takeuforward-sheet");
        curr.add(normalizeTag(repo.split("/")[1] || "sheet"));
        for (const t of tags) curr.add(t);
        collected.set(slug, curr);
      }
    } catch {
      // Best-effort source
    }
  }
  return collected;
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

function makeQuestionPayload(question, sheetTags) {
  const title = String(question.title || "").trim();
  const slug = String(question.titleSlug || "").trim().toLowerCase();
  const difficulty = String(question.difficulty || "").trim();
  const topics = cleanTopicTags(
    Array.isArray(question.topicTags) ? question.topicTags.map((t) => String(t.name || "").trim()) : []
  );
  const description = stripHtml(question.content || "");
  const examples = parseExamplesFromText(description);
  const testcases = examples.map((ex) => ({ input: ex.input, expectedOutput: ex.output }));

  if (!title || !slug) return null;
  if (!["Easy", "Medium", "Hard"].includes(difficulty)) return null;
  if (topics.length === 0) return null;
  if (description.length < 80) return null;
  if (testcases.length === 0) return null;

  let starter = { cpp: "", java: "", python: "" };
  try {
    const defs = JSON.parse(String(question.codeDefinition || "[]"));
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
    topic: topics,
    acceptance_rate: Math.round(Number(question.acRate || 0)),
    description,
    examples,
    testcases,
    starter_code: starter,
    source: sheetTags?.size > 0 ? "leetcode-full+sheet" : "leetcode-full",
    company_tags: [],
    pattern_tags: sheetTags?.size > 0 ? Array.from(sheetTags).slice(0, 10) : [],
  };
}

async function importQuestionsToDB(questions) {
  console.log(`\n📊 Importing ${questions.length} questions to database...`);

  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, Math.min(i + batchSize, questions.length));

    try {
      const { error } = await supabase
        .from("questions")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✓ Batch ${i / batchSize + 1}: ${batch.length} questions inserted/updated (total success: ${successCount})`);
      }
    } catch (err) {
      console.error(`❌ Batch ${i / batchSize + 1} failed:`, err.message);
      errorCount += batch.length;
    }

    // Add a small delay between batches
    if (i + batchSize < questions.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\n📈 Import complete: ${successCount} succeeded, ${errorCount} failed`);
  return { successCount, errorCount };
}

async function main() {
  try {
    console.log("🚀 NextHire AI - Industrial DSA Importer");
    console.log("=".repeat(50));

    const maxQuestions = Number(process.env.LEETCODE_IMPORT_LIMIT || 700);
    const sheetOnlyFirst = String(process.env.SHEET_FIRST || "true").toLowerCase() !== "false";

    const sheetSlugMap = await fetchSheetSlugMap();
    const sheetSlugs = Array.from(sheetSlugMap.keys());
    console.log(`📚 Sheet-linked slugs found: ${sheetSlugs.length}`);

    const catalogSlugs = await fetchCatalog(maxQuestions * 2);
    const finalSlugList = [];
    const seen = new Set();

    if (sheetOnlyFirst) {
      for (const s of sheetSlugs) {
        if (seen.has(s)) continue;
        seen.add(s);
        finalSlugList.push(s);
      }
    }
    for (const s of catalogSlugs) {
      if (finalSlugList.length >= maxQuestions) break;
      if (seen.has(s)) continue;
      seen.add(s);
      finalSlugList.push(s);
    }

    console.log(`📥 Candidate slugs to process: ${finalSlugList.length}`);

    const prepared = [];
    for (let i = 0; i < finalSlugList.length; i++) {
      const slug = finalSlugList[i];
      const detail = await fetchQuestionDetail(slug);
      if (!detail) continue;

      const payload = makeQuestionPayload(detail, sheetSlugMap.get(slug));
      if (payload) prepared.push(payload);

      if ((i + 1) % 25 === 0) {
        console.log(`Processed ${i + 1}/${finalSlugList.length}, qualified=${prepared.length}`);
      }
      await new Promise((r) => setTimeout(r, 160));
    }

    console.log(`✅ Qualified complete questions: ${prepared.length}`);
    const result = await importQuestionsToDB(prepared);

    console.log("\n" + "=".repeat(50));
    console.log("✅ Bulk import completed successfully!");
    console.log(`   Total qualified questions: ${prepared.length}`);
    const fromSheets = prepared.filter((q) => Array.isArray(q.pattern_tags) && q.pattern_tags.includes("takeuforward-sheet")).length;
    console.log(`   Sheet-tagged (TakeUForward/Striver style): ${fromSheets}`);
    console.log(`   Success: ${result.successCount}`);
    console.log(`   Errors: ${result.errorCount}`);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();

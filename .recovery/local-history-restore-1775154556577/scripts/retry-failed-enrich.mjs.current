import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const failedIds = [
  "find-palindrome-with-fixed-length",
  "guess-the-number-using-bitwise-questions-ii",
  "find-the-quiet-students-in-all-exams",
];

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

function normalizeTag(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9+]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeCompany(value) {
  return normalizeTag(value).replace(/-inc$|-corp$|-llc$/g, "");
}

function parseTopics(data) {
  if (!Array.isArray(data?.topicTags)) return [];
  return data.topicTags.map((v) => normalizeTag(v?.name || v)).filter(Boolean);
}

function parseCompanies(data) {
  if (!Array.isArray(data?.companyTags)) return [];
  return data.companyTags.map((v) => normalizeCompany(v?.name || v?.slug || v)).filter(Boolean);
}

async function enrichOne(slug) {
  let topics = [];
  let companies = [];

  try {
    const piedRes = await fetch(`https://leetcode-api-pied.vercel.app/problem/${slug}`, { headers: { "User-Agent": "NextHireAI-Retry/1.0" } });
    if (piedRes.ok) {
      const pied = await piedRes.json();
      topics = parseTopics(pied);
      companies = parseCompanies(pied);
    }
  } catch {
    // ignore
  }

  if (topics.length === 0) {
    try {
      const gqlRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NextHireAI-Retry/1.0",
          Referer: "https://leetcode.com/problemset/",
        },
        body: JSON.stringify({
          query: "query q($titleSlug: String!) { question(titleSlug: $titleSlug) { topicTags { name } } }",
          variables: { titleSlug: slug },
        }),
      });
      if (gqlRes.ok) {
        const payload = await gqlRes.json();
        topics = Array.isArray(payload?.data?.question?.topicTags)
          ? payload.data.question.topicTags.map((t) => normalizeTag(t?.name)).filter(Boolean)
          : [];
      }
    } catch {
      // ignore
    }
  }

  return { topics, companies };
}

const env = { ...readDotEnvFile(path.join(process.cwd(), ".env.local")), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env vars");
const supabase = createClient(url, key, { auth: { persistSession: false } });

for (const id of failedIds) {
  try {
    const { data } = await supabase.from("questions").select("id,topic,company_tags,pattern_tags").eq("id", id).maybeSingle();
    if (!data) {
      console.log("not found", id);
      continue;
    }

    const existingTopics = Array.isArray(data.topic) ? data.topic.map(normalizeTag).filter(Boolean) : [];
    const existingCompanies = Array.isArray(data.company_tags) ? data.company_tags.map(normalizeCompany).filter(Boolean) : [];
    const existingPatterns = Array.isArray(data.pattern_tags) ? data.pattern_tags.map(normalizeTag).filter(Boolean) : [];

    const fetched = await enrichOne(id);
    const mergedTopics = Array.from(new Set(["leetcode", ...existingTopics, ...existingPatterns, ...existingCompanies, ...fetched.topics, ...fetched.companies])).slice(0, 25);
    const mergedCompanies = Array.from(new Set([...existingCompanies, ...fetched.companies])).slice(0, 60);

    const { error } = await supabase.from("questions").update({
      topic: mergedTopics,
      company_tags: mergedCompanies,
      pattern_tags: existingPatterns,
    }).eq("id", id);

    if (error) {
      console.log("update failed", id, error.message);
    } else {
      console.log("updated", id, "topics", mergedTopics.length, "companies", mergedCompanies.length);
    }
  } catch (e) {
    console.log("retry failed", id, e?.message || e);
  }
}

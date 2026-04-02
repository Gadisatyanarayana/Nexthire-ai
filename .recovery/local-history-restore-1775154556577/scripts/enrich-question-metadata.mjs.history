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

function normalizeTag(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCompany(value) {
  return normalizeTag(value).replace(/-inc$|-corp$|-llc$/g, "");
}

function parsePiedTopics(data) {
  if (!Array.isArray(data?.topicTags)) return [];
  return data.topicTags
    .map((item) => (typeof item === "string" ? item : item?.name))
    .map(normalizeTag)
    .filter(Boolean);
}

function parsePiedCompanies(data) {
  const raw = data?.companyTags;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.slug || item.name || item.company;
      return "";
    })
    .map(normalizeCompany)
    .filter(Boolean);
}

function parseAlfaCompanyStats(data) {
  const raw = data?.companyTagStats;
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return item.companyName || item.companySlug || item.slug || item.name;
    })
    .map(normalizeCompany)
    .filter(Boolean);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "NextHireAI-MetadataEnricher/1.0",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Request failed ${res.status} ${url}`);
  return res.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, attempts = 3, baseDelayMs = 350) {
  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await sleep(baseDelayMs * (i + 1));
      }
    }
  }
  throw lastError;
}

async function fetchGraphqlTopics(slug) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NextHireAI-MetadataEnricher/1.0",
      Referer: "https://leetcode.com/problemset/",
    },
    body: JSON.stringify({
      query: "query q($titleSlug: String!) { question(titleSlug: $titleSlug) { topicTags { name } } }",
      variables: { titleSlug: slug },
    }),
  });

  if (!res.ok) return [];
  const payload = await res.json();
  const tags = payload?.data?.question?.topicTags;
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => normalizeTag(t?.name)).filter(Boolean);
}

async function enrichOne(slug) {
  let topics = [];
  let companies = [];

  try {
    const pied = await fetchJson(`https://leetcode-api-pied.vercel.app/problem/${slug}`);
    topics = parsePiedTopics(pied);
    companies = parsePiedCompanies(pied);
  } catch {
    // Continue with fallbacks.
  }

  if (topics.length === 0) {
    try {
      topics = await fetchGraphqlTopics(slug);
    } catch {
      // Keep empty.
    }
  }

  if (companies.length === 0) {
    try {
      const alfa = await fetchJson(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`);
      companies = parseAlfaCompanyStats(alfa);
    } catch {
      // Keep empty.
    }
  }

  return { topics, companies };
}

async function runWithConcurrency(items, worker, concurrency) {
  const queue = [...items];
  const results = [];

  async function consume() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const result = await worker(item);
      results.push(result);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => consume()));
  return results;
}

async function loadAllQuestions(supabase) {
  const pageSize = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("questions")
      .select("id, topic, company_tags, pattern_tags")
      .range(from, to);

    if (error) throw new Error(`Failed to load questions: ${error.message}`);
    const rows = Array.isArray(data) ? data : [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("Loading questions from Supabase...");
  const rows = await loadAllQuestions(supabase);
  const targets = rows;

  console.log(`Total questions: ${rows.length}`);
  const missingBefore = rows.filter((row) => {
    const topicEmpty = !Array.isArray(row.topic) || row.topic.length === 0;
    const companyEmpty = !Array.isArray(row.company_tags) || row.company_tags.length === 0;
    return topicEmpty || companyEmpty;
  }).length;

  console.log(`Questions missing topics or companies before merge: ${missingBefore}`);
  console.log(`Questions to process: ${targets.length}`);

  if (rows.length === 0) {
    console.log("Nothing to enrich.");
    return;
  }

  let processed = 0;
  const enriched = await runWithConcurrency(
    targets,
    async (row) => {
      const slug = String(row.id || "").trim();
      const existingTopics = Array.isArray(row.topic) ? row.topic.map((v) => normalizeTag(v)).filter(Boolean) : [];
      const existingCompanies = Array.isArray(row.company_tags) ? row.company_tags.map((v) => normalizeCompany(v)).filter(Boolean) : [];
      const existingPatterns = Array.isArray(row.pattern_tags)
        ? row.pattern_tags.map((v) => normalizeTag(v)).filter(Boolean)
        : [];

      const topicEmpty = existingTopics.length === 0;
      const companyEmpty = existingCompanies.length === 0;

      let topics = [];
      let companies = [];
      if (topicEmpty || companyEmpty) {
        const fetched = await withRetry(() => enrichOne(slug), 3, 300);
        topics = fetched.topics;
        companies = fetched.companies;
      }

      processed += 1;
      if (processed % 100 === 0 || processed === targets.length) {
        console.log(`Enriched ${processed}/${targets.length}`);
      }

      const mergedTopics = Array.from(
        new Set([
          "leetcode",
          ...existingTopics,
          ...topics,
          ...existingPatterns,
          ...existingCompanies,
          ...companies,
        ])
      )
        .map((v) => normalizeTag(v))
        .filter(Boolean)
        .slice(0, 25);
      const mergedCompanies = Array.from(new Set([...existingCompanies, ...companies])).slice(0, 60);
      const mergedPatterns = existingPatterns;

      return {
        id: slug,
        topic: mergedTopics,
        company_tags: mergedCompanies,
        pattern_tags: mergedPatterns,
      };
    },
    6
  );

  let updated = 0;
  let failedUpdates = 0;
  const failedIds = [];

  for (const row of enriched) {
    try {
      const result = await withRetry(
        async () =>
          supabase
            .from("questions")
            .update({
              topic: row.topic,
              company_tags: row.company_tags,
              pattern_tags: row.pattern_tags,
            })
            .eq("id", row.id),
        3,
        350
      );

      if (result.error) {
        throw new Error(result.error.message || "Unknown update error");
      }

      updated += 1;
      if (updated % 100 === 0 || updated === enriched.length) {
        console.log(`Updated ${updated}/${enriched.length}`);
      }
    } catch (error) {
      failedUpdates += 1;
      failedIds.push(row.id);
      console.warn(`Skipping ${row.id} after retries: ${error?.message || error}`);
    }
  }

  const { count: topicCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .not("topic", "eq", "{}");

  const { count: companyCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .not("company_tags", "eq", "{}");

  console.log("Enrichment complete.");
  console.log(`Questions with topic tags: ${topicCount ?? 0}`);
  console.log(`Questions with company tags: ${companyCount ?? 0}`);
  console.log(`Failed updates: ${failedUpdates}`);
  if (failedIds.length > 0) {
    console.log(`Sample failed IDs: ${failedIds.slice(0, 10).join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

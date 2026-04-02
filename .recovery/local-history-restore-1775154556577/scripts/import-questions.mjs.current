import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const REPOS = [
  { owner: "seanprashad", repo: "leetcode-patterns", kind: "patterns" },
  { owner: "krishnadey30", repo: "LeetCode-Questions-CompanyWise", kind: "company" },
  { owner: "noworneverev", repo: "leetcode-api", kind: "dataset" },
  { owner: "neenza", repo: "leetcode-problems", kind: "dataset" },
];

const STARTER_CODE = {
  cpp: "auto solve() {\n    // Write your logic here.\n}",
  java: "Object solve() {\n    // Write your logic here.\n    return null;\n}",
  python: "def solve():\n    # Write your logic here\n    return None\n",
};

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

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function normalizeTag(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function extractSlugsFromText(content) {
  const out = new Set();
  const regex = /leetcode\.com\/problems\/([a-z0-9-]+)\/?/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) out.add(match[1].toLowerCase());
  }
  return out;
}

function extractSlugTagPairsFromMarkdown(content) {
  const pairs = [];
  let currentTag = "";
  const lines = String(content || "").split(/\r?\n/);

  for (const line of lines) {
    const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    if (headingMatch) {
      currentTag = normalizeTag(headingMatch[1]);
      continue;
    }

    const boldMatch = line.match(/^\s*[-*\d.)\s]*\*\*(.+?)\*\*/);
    if (boldMatch) {
      const candidate = normalizeTag(boldMatch[1]);
      if (candidate) currentTag = candidate;
    }

    const slugs = extractSlugsFromText(line);
    if (slugs.size === 0) continue;
    const tag = currentTag || "";
    for (const slug of slugs) {
      pairs.push({ slug, tag });
    }
  }

  return pairs;
}

function slugifyText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanProblemDescription(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*Example\s*\d+\s*:\s*$/gim, "")
    .replace(/\n\s*Examples?\s*:\s*$/gim, "")
    .replace(/\n\s*Constraints\s*:\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseExampleText(exampleText) {
  const text = String(exampleText || "").replace(/\r\n/g, "\n").trim();
  if (!text) return null;

  const inputMatch = text.match(/Input\s*:\s*([\s\S]*?)(?=\n\s*Output\s*:|$)/i);
  const outputMatch = text.match(/Output\s*:\s*([\s\S]*?)(?=\n\s*Explanation\s*:|$)/i);
  const explanationMatch = text.match(/Explanation\s*:\s*([\s\S]*?)$/i);

  const input = String(inputMatch?.[1] || "").trim();
  const output = String(outputMatch?.[1] || "").trim();
  const explanation = String(explanationMatch?.[1] || "").trim();

  if (!input || !output) return null;

  return {
    input,
    output,
    explanation: explanation || undefined,
  };
}

function toConstraintLines(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .slice(0, 30);
}

function parseDatasetJson(content) {
  const out = new Map();
  let payload;
  try {
    payload = JSON.parse(content);
  } catch {
    return out;
  }

  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.questions)
    ? payload.questions
    : [];

  for (const item of records) {
    const title = item?.title || item?.name || item?.questionTitle || "";
    const slug = slugifyText(item?.titleSlug || item?.slug || title);
    if (!slug) continue;

    const difficultyRaw = String(item?.difficulty || "");
    const difficulty = /easy/i.test(difficultyRaw)
      ? "Easy"
      : /hard/i.test(difficultyRaw)
      ? "Hard"
      : difficultyRaw
      ? "Medium"
      : "";

    const description = cleanProblemDescription(item?.description || item?.content || item?.problem || "");
    const parsedExamples = Array.isArray(item?.examples)
      ? item.examples
          .map((ex) => parseExampleText(ex?.example_text || ex?.text || ""))
          .filter(Boolean)
      : [];
    const constraints = toConstraintLines(item?.constraints);
    const testcases = parsedExamples
      .map((ex) => ({
        input: ex.input,
        expectedOutput: ex.output,
      }))
      .slice(0, 8);

    const hasExplicitIOMarkers = /\binput\s*:/i.test(description) && /\boutput\s*:/i.test(description);
    const inputType = hasExplicitIOMarkers ? "structured" : "auto";
    const outputType = hasExplicitIOMarkers ? "structured" : "auto";
    const topicTags = [
      ...(Array.isArray(item?.tags) ? item.tags : []),
      ...(Array.isArray(item?.topics) ? item.topics : []),
      ...(Array.isArray(item?.topicTags) ? item.topicTags.map((t) => (typeof t === "string" ? t : t?.name)) : []),
    ]
      .map((t) => normalizeTag(t))
      .filter(Boolean);

    out.set(slug, {
      difficulty,
      description,
      topicTags,
      examples: parsedExamples,
      constraints,
      testcases,
      inputType,
      outputType,
    });
  }

  return out;
}

function shouldScanPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("node_modules")) return false;
  if (lower.endsWith(".md") || lower.endsWith(".json") || lower.endsWith(".txt") || lower.endsWith(".csv")) return true;
  if (lower === "readme.md") return true;
  return false;
}

function extractCompanyFromCsvPath(filePath) {
  const base = String(filePath || "").split("/").pop() || "";
  const noExt = base.replace(/\.[a-z0-9]+$/i, "");
  const cleaned = noExt.replace(/_(alltime|\d+year|\d+months)$/i, "");
  return normalizeTag(cleaned);
}

function parseCompanyCsv(content) {
  const out = new Map();
  const lines = String(content || "").split(/\r?\n/);
  for (const line of lines) {
    const slugMatch = line.match(/leetcode\.com\/problems\/([a-z0-9-]+)\/?/i);
    if (!slugMatch?.[1]) continue;
    const slug = slugMatch[1].toLowerCase();
    const difficultyMatch = line.match(/,(Easy|Medium|Hard),/i);
    const difficulty = difficultyMatch?.[1]
      ? difficultyMatch[1][0].toUpperCase() + difficultyMatch[1].slice(1).toLowerCase()
      : "";

    out.set(slug, {
      difficulty,
      description: "",
      topicTags: [],
      examples: [],
      constraints: [],
      testcases: [],
      inputType: "auto",
      outputType: "auto",
    });
  }
  return out;
}

function walkCsvFiles(rootDir) {
  const out = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
        out.push(abs);
      }
    }
  }

  return out;
}

function ingestCompanyRepoViaGit(repoInfo, aggregate, datasetDetails) {
  const tempDir = path.join(os.tmpdir(), `nexthire-${repoInfo.repo}-${Date.now()}`);
  const repoUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}.git`;

  try {
    const clone = spawnSync("git", ["clone", "--depth", "1", repoUrl, tempDir], {
      encoding: "utf8",
    });

    if (clone.status !== 0) {
      throw new Error((clone.stderr || clone.stdout || "git clone failed").trim());
    }

    const csvFiles = walkCsvFiles(tempDir).slice(0, 3000);

    for (const absCsvPath of csvFiles) {
      const rel = path.relative(tempDir, absCsvPath).replace(/\\/g, "/");
      const content = fs.readFileSync(absCsvPath, "utf8");
      const parsedCsv = parseCompanyCsv(content);
      const companyTag = extractCompanyFromCsvPath(rel);

      for (const [slug, details] of parsedCsv.entries()) {
        if (!datasetDetails.has(slug)) datasetDetails.set(slug, details);

        const curr =
          aggregate.get(slug) ||
          {
            slug,
            sourceRepos: new Set(),
            companyTags: new Set(),
            patternTags: new Set(),
          };

        curr.sourceRepos.add(`${repoInfo.owner}/${repoInfo.repo}`);
        if (companyTag) curr.companyTags.add(companyTag);
        aggregate.set(slug, curr);
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function extractTagsFromPath(filePath) {
  const generic = new Set([
    "leetcode",
    "leetcodes",
    "problems",
    "problem",
    "question",
    "questions",
    "company",
    "companies",
    "readme",
    "readme-md",
    "src",
    "data",
    "dataset",
    "json",
    "md",
    "txt",
  ]);

  const parts = String(filePath || "")
    .split("/")
    .map((p) => p.replace(/\.[a-z0-9]+$/i, ""))
    .map((p) => normalizeTag(p))
    .filter(Boolean)
    .filter((p) => !generic.has(p));

  return Array.from(new Set(parts)).slice(0, 8);
}

function githubHeaders(githubToken) {
  const headers = {
    "User-Agent": "NextHireAI-Importer",
    Accept: "application/vnd.github+json",
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  return headers;
}

async function fetchJSON(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Request failed ${res.status} for ${url}`);
  }
  return res.json();
}

async function fetchText(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Request failed ${res.status} for ${url}`);
  }
  return res.text();
}

async function getRepoDefaultBranch(owner, repo, headers) {
  const data = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}`, headers);
  return data.default_branch || "main";
}

async function getRepoTree(owner, repo, branch, headers) {
  const data = await fetchJSON(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    headers
  );
  return Array.isArray(data.tree) ? data.tree : [];
}

async function fetchLeetCodeCatalog() {
  const all = [];
  let skip = 0;
  const limit = 250;
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NextHireAI-Importer",
          Referer: "https://leetcode.com/problemset/",
        },
        body: JSON.stringify({
          query: `
            query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int) {
              problemsetQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip) {
                hasMore
                questions {
                  title
                  titleSlug
                  difficulty
                  acRate
                  topicTags { name }
                }
              }
            }
          `,
          variables: { categorySlug: "", limit, skip },
        }),
      });

      if (!res.ok) {
        throw new Error(`LeetCode GraphQL failed ${res.status}`);
      }

      const payload = await res.json();
      const list = payload?.data?.problemsetQuestionList;
      const questions = Array.isArray(list?.questions) ? list.questions : [];
      all.push(...questions);
      hasMore = Boolean(list?.hasMore);
      skip += limit;

      if (questions.length === 0) break;
      if (all.length > 5500) break;
    }

    return all;
  } catch {
    console.warn("GraphQL catalog failed, using fallback /api/problems/all");

    const res = await fetch("https://leetcode.com/api/problems/all/", {
      headers: { "User-Agent": "NextHireAI-Importer" },
    });

    if (!res.ok) {
      throw new Error(`LeetCode fallback catalog failed ${res.status}`);
    }

    const payload = await res.json();
    const pairs = Array.isArray(payload?.stat_status_pairs) ? payload.stat_status_pairs : [];

    return pairs
      .map((item) => {
        const slug = String(item?.stat?.question__title_slug || "").toLowerCase();
        const title = String(item?.stat?.question__title || "");
        const level = Number(item?.difficulty?.level || 2);
        const difficulty = level === 1 ? "Easy" : level === 2 ? "Medium" : "Hard";
        return {
          title,
          titleSlug: slug,
          difficulty,
          acRate: 0,
          topicTags: [],
        };
      })
      .filter((q) => q.titleSlug && q.title);
  }
}

async function collectSlugsAndTags(githubToken) {
  const headers = githubHeaders(githubToken);
  const aggregate = new Map();
  const datasetDetails = new Map();

  for (const repoInfo of REPOS) {
    let branch = "main";
    let tree = [];
    try {
      branch = await getRepoDefaultBranch(repoInfo.owner, repoInfo.repo, headers);
      tree = await getRepoTree(repoInfo.owner, repoInfo.repo, branch, headers);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (repoInfo.kind === "company") {
        console.warn(`GitHub API blocked ${repoInfo.owner}/${repoInfo.repo}: ${message}`);
        console.warn(`Falling back to git clone for ${repoInfo.owner}/${repoInfo.repo}...`);
        try {
          ingestCompanyRepoViaGit(repoInfo, aggregate, datasetDetails);
          continue;
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.warn(`Skipping ${repoInfo.owner}/${repoInfo.repo} after fallback failure: ${fallbackMessage}`);
          continue;
        }
      }

      console.warn(`Skipping ${repoInfo.owner}/${repoInfo.repo}: ${message}`);
      continue;
    }

    const allCandidatePaths = tree
      .filter((item) => item.type === "blob" && shouldScanPath(item.path || ""))
      .map((item) => item.path);

    const companyCsvPaths =
      repoInfo.kind === "company"
        ? allCandidatePaths.filter((p) => p.toLowerCase().endsWith(".csv"))
        : [];

    const candidatePaths =
      repoInfo.kind === "company"
        ? companyCsvPaths.slice(0, 2500)
        : allCandidatePaths.slice(0, 350);

    for (const filePath of candidatePaths) {
      const rawUrl = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${branch}/${filePath}`;
      let content = "";
      try {
        content = await fetchText(rawUrl, headers);
      } catch {
        continue;
      }

      if (filePath.toLowerCase().endsWith(".json")) {
        const parsedDetails = parseDatasetJson(content);
        for (const [slug, details] of parsedDetails.entries()) {
          datasetDetails.set(slug, details);
        }
      }
      if (repoInfo.kind === "company" && filePath.toLowerCase().endsWith(".csv")) {
        const parsedCsv = parseCompanyCsv(content);
        for (const [slug, details] of parsedCsv.entries()) {
          if (!datasetDetails.has(slug)) datasetDetails.set(slug, details);
        }
      }

      const slugs = extractSlugsFromText(content);
      if (slugs.size === 0) continue;

      const pathTags = extractTagsFromPath(filePath);
      const companyFromFile =
        repoInfo.kind === "company" && filePath.toLowerCase().endsWith(".csv")
          ? extractCompanyFromCsvPath(filePath)
          : "";
      const markdownPairs =
        filePath.toLowerCase().endsWith(".md") || filePath.toLowerCase().endsWith(".txt")
          ? extractSlugTagPairsFromMarkdown(content)
          : [];
      const markdownTagBySlug = new Map();
      for (const pair of markdownPairs) {
        if (!pair.tag) continue;
        if (!markdownTagBySlug.has(pair.slug)) markdownTagBySlug.set(pair.slug, new Set());
        markdownTagBySlug.get(pair.slug).add(pair.tag);
      }

      for (const slug of slugs) {
        const curr =
          aggregate.get(slug) ||
          {
            slug,
            sourceRepos: new Set(),
            companyTags: new Set(),
            patternTags: new Set(),
          };

        curr.sourceRepos.add(`${repoInfo.owner}/${repoInfo.repo}`);

        const headingTags = Array.from(markdownTagBySlug.get(slug) || []);
        const mergedPathTags = Array.from(
          new Set([...pathTags, ...headingTags, ...(companyFromFile ? [companyFromFile] : [])])
        );

        if (repoInfo.kind === "company") {
          for (const tag of mergedPathTags) {
            curr.companyTags.add(tag);
          }
        }
        if (repoInfo.kind === "patterns") {
          for (const tag of mergedPathTags) {
            curr.patternTags.add(tag);
          }
        }
        if (repoInfo.kind === "dataset") {
          for (const tag of mergedPathTags) {
            curr.patternTags.add(tag);
          }
        }

        aggregate.set(slug, curr);
      }
    }
  }

  return { aggregate, datasetDetails };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const githubToken = env.GITHUB_TOKEN || "";

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("Collecting problem slugs from GitHub repositories...");
  const { aggregate: aggregated, datasetDetails } = await collectSlugsAndTags(githubToken);
  const slugList = Array.from(aggregated.keys());
  console.log(`Collected ${slugList.length} unique slugs from repos.`);

  if (slugList.length === 0) {
    throw new Error("No slugs found from configured repositories.");
  }

  console.log("Fetching LeetCode catalog for details...");
  const catalog = await fetchLeetCodeCatalog();
  const bySlug = new Map(catalog.map((q) => [String(q.titleSlug || "").toLowerCase(), q]));

  const rows = slugList.map((slug) => {
    const info = aggregated.get(slug);
    const q = bySlug.get(slug);
    const ds = datasetDetails.get(slug);
    const baseTopics = Array.isArray(q?.topicTags)
      ? q.topicTags.map((t) => normalizeTag(t?.name)).filter(Boolean)
      : [];
    const datasetTopics = Array.isArray(ds?.topicTags) ? ds.topicTags : [];

    const patternTopics = Array.from(info.patternTags || []);
    const companyTopics = Array.from(info.companyTags || []);
    const topic = Array.from(new Set(["leetcode", ...baseTopics, ...datasetTopics, ...patternTopics, ...companyTopics])).slice(0, 12);

    const constraintsBlock = Array.isArray(ds?.constraints) && ds.constraints.length > 0
      ? `\n\nConstraints:\n${ds.constraints.map((line) => `- ${line}`).join("\n")}`
      : "";

    return {
      id: slug,
      slug,
      title: q?.title || titleFromSlug(slug),
      difficulty: q?.difficulty || ds?.difficulty || "Medium",
      function_name: "solve",
      input_type: ds?.inputType || "auto",
      output_type: ds?.outputType || "auto",
      acceptance_rate: Math.round(Number(q?.acRate ?? 0)),
      topic,
      company_tags: Array.from(info.companyTags || []).slice(0, 50),
      pattern_tags: patternTopics.slice(0, 50),
      description: (ds?.description ? `${ds.description}${constraintsBlock}` : "") || (q?.title
        ? `Solve ${q.title}. Full statement can be viewed on LeetCode.`
        : `Solve ${titleFromSlug(slug)}.`),
      source: Array.from(info.sourceRepos || []).join(", "),
      examples: Array.isArray(ds?.examples) ? ds.examples.slice(0, 5) : [],
      testcases: Array.isArray(ds?.testcases) ? ds.testcases.slice(0, 8) : [],
      starter_code: STARTER_CODE,
    };
  });

  console.log(`Prepared ${rows.length} rows for upsert.`);

  const chunkSize = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("questions").upsert(chunk, { onConflict: "id" });
    if (error) {
      throw new Error(`Supabase upsert failed at chunk ${i / chunkSize + 1}: ${error.message}`);
    }
    upserted += chunk.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  const syncedAt = new Date().toISOString();
  await supabase.from("app_meta").upsert(
    { key: "questions_last_sync_at", value: syncedAt, updated_at: syncedAt },
    { onConflict: "key" }
  );

  console.log(`Done. Total upserted: ${upserted}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

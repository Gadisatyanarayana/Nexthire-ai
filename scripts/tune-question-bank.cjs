const fs = require("fs");
const path = require("path");
const Module = require("module");

process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const workspaceRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const mappedRequest = path.join(workspaceRoot, "src", request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
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
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }

  return out;
}

function loadEnv() {
  const root = process.cwd();
  const local = readDotEnvFile(path.join(root, ".env.local"));
  const example = readDotEnvFile(path.join(root, ".env.example"));
  Object.assign(process.env, example, local, process.env);
}

function parseArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return fallback;
  const value = arg.slice(prefix.length);
  return value === "" ? fallback : value;
}

function parseBoolArg(name, fallback = false) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return fallback;
  const value = arg.slice(prefix.length).toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function normalizeDifficulty(value) {
  const difficulty = String(value || "Easy").trim().toLowerCase();
  if (difficulty === "medium") return "medium";
  if (difficulty === "hard") return "hard";
  return "easy";
}

function hiddenTargetForDifficulty(value) {
  return 20;
}

async function main() {
  loadEnv();

  const { getAdminClient } = require("../src/lib/supabaseAdmin");
  const { generateAndStoreProblemTestCases } = require("../src/lib/problemTestCaseService");

  const limit = Math.max(1, Number(parseArg("limit", "500")) || 500);
  const offset = Math.max(0, Number(parseArg("offset", "0")) || 0);
  const batchSize = Math.max(1, Math.min(10, Number(parseArg("batchSize", "2")) || 2));
  const overwrite = parseBoolArg("overwrite", true);
  const validateWithSandbox = parseBoolArg("validateWithSandbox", true);
  const dryRun = parseBoolArg("dryRun", false);

  const admin = getAdminClient();

  const pageSize = 1000;
  const questions = [];
  let currentOffset = offset;

  while (questions.length < limit) {
    const remaining = limit - questions.length;
    const chunkSize = Math.min(pageSize, remaining);

    const { data: rows, error } = await admin
      .from("questions")
      .select("id, title, difficulty")
      .order("id", { ascending: true })
      .range(currentOffset, currentOffset + chunkSize - 1);

    if (error) {
      throw new Error(error.message || "Failed to load questions");
    }

    const chunk = Array.isArray(rows) ? rows : [];
    if (chunk.length === 0) {
      break;
    }

    questions.push(...chunk);
    currentOffset += chunk.length;

    if (chunk.length < chunkSize) {
      break;
    }
  }

  if (questions.length === 0) {
    console.log("No questions found in the selected window.");
    return;
  }

  const plan = questions.map((question) => ({
    id: String(question.id || ""),
    title: String(question.title || ""),
    difficulty: String(question.difficulty || "Easy"),
    targetHidden: hiddenTargetForDifficulty(question.difficulty),
  }));

  console.log(`Loaded ${plan.length} question(s) from offset ${offset} with limit ${limit}.`);
  console.log(`Mode: ${dryRun ? "dry-run" : "tune"}, batchSize=${batchSize}, overwrite=${overwrite}, validateWithSandbox=${validateWithSandbox}`);

  if (dryRun) {
    const counts = plan.reduce((acc, item) => {
      acc[item.difficulty] = (acc[item.difficulty] || 0) + 1;
      return acc;
    }, {});
    console.log(JSON.stringify({ counts, plan }, null, 2));
    return;
  }

  const results = [];

  for (let index = 0; index < plan.length; index += batchSize) {
    const batch = plan.slice(index, index + batchSize);
    console.log(`Processing ${Math.min(index + batchSize, plan.length)}/${plan.length}...`);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await generateAndStoreProblemTestCases(item.id, {
            overwrite,
            visibleCount: 3,
            hiddenCount: item.targetHidden,
            validateWithSandbox,
          });

          return {
            id: item.id,
            title: item.title,
            difficulty: item.difficulty,
            status: "generated",
            visibleCount: result.coverage.visibleCount,
            hiddenCount: result.coverage.hiddenCount,
            warnings: result.warnings,
            validation: result.validation,
          };
        } catch (err) {
          return {
            id: item.id,
            title: item.title,
            difficulty: item.difficulty,
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
          };
        }
      })
    );

    results.push(...batchResults);
    const generated = results.filter((item) => item.status === "generated").length;
    const failed = results.filter((item) => item.status === "failed").length;
    console.log(`Progress: generated=${generated}, failed=${failed}`);
  }

  const summary = results.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { generated: 0, failed: 0 }
  );

  const reportPath = path.join(process.cwd(), "tmp_question_tune_report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ summary, results }, null, 2), "utf8");

  console.log(`Done. Generated=${summary.generated}, failed=${summary.failed}`);
  console.log(`Report written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
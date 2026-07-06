process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");
const fs = require("fs");
const path = require("path");
const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), "src", request.slice(2)), parent, isMain, options);
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
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}
const root = process.cwd();
Object.assign(process.env, readDotEnvFile(path.join(root, ".env.example")), readDotEnvFile(path.join(root, ".env.local")), process.env);

const { getAdminClient } = require("../src/lib/supabaseAdmin");

async function run() {
  const admin = getAdminClient();
  const { data: matrixQuestion } = await admin
    .from("questions")
    .select("id, testcases")
    .eq("id", "01-matrix")
    .single();

  const cases = matrixQuestion.testcases;
  let updated = false;

  for (const tc of cases) {
    if (tc.input.includes("[[1,1,1],[1,1,1],[1,1,0]]")) {
      tc.isHidden = false;
      tc.hidden = false;
      updated = true;
      console.log("Made strong matrix test case VISIBLE!");
    }
  }

  if (updated) {
    await admin.from("questions").update({ testcases: cases }).eq("id", "01-matrix");
    console.log("Updated database successfully.");
  } else {
    console.log("Strong test case not found in testcases array.");
  }
}
run().catch(console.error);

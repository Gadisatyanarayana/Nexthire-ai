process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const path = require("path");

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

const root = process.cwd();
const localEnv = readDotEnvFile(path.join(root, ".env.local"));
const exampleEnv = readDotEnvFile(path.join(root, ".env.example"));
Object.assign(process.env, exampleEnv, localEnv, process.env);

const { getAdminClient } = require("./src/lib/supabaseAdmin");

async function run() {
  const admin = getAdminClient();
  
  const testcases = [
    {
      input: "mat = [[0,0,0],[0,1,0],[0,0,0]]",
      expectedOutput: "[[0,0,0],[0,1,0],[0,0,0]]"
    },
    {
      input: "mat = [[0,0,0],[0,1,0],[1,1,1]]",
      expectedOutput: "[[0,0,0],[0,1,0],[1,2,1]]"
    },
    {
      input: "mat = [[1,1,1],[1,1,1],[1,1,0]]",
      expectedOutput: "[[4,3,2],[3,2,1],[2,1,0]]"
    },
    {
      input: "mat = [[1,0,1,1],[1,1,1,1],[1,1,1,1]]",
      expectedOutput: "[[1,0,1,2],[2,1,2,3],[3,2,3,4]]"
    }
  ];

  console.log("Updating testcases for 01-matrix...");
  const { data, error } = await admin
    .from("questions")
    .update({ testcases })
    .eq("id", "01-matrix")
    .select();
    
  if (error) {
    console.error("Update error:", error);
    return;
  }
  
  console.log("Successfully updated 01-matrix testcases. New count:", data[0].testcases.length);
}

run().catch(console.error);

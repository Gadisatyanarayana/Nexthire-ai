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
  const local = readDotEnvFile(path.join(root, ".env.local"));
  const example = readDotEnvFile(path.join(root, ".env.example"));
  return { ...example, ...local, ...process.env };
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

  // Check output_type distribution
  const allQuestions = await supabase
    .from("questions")
    .select("id, title, output_type, starter_code")
    .limit(20);

  if (allQuestions.error) {
    throw new Error(`Failed to fetch questions: ${allQuestions.error.message}`);
  }

  console.log("Sample questions:");
  console.log(JSON.stringify(allQuestions.data, null, 2));

  // Check unique output_types
  const allQuestionsNoLimit = await supabase
    .from("questions")
    .select("output_type", { count: "exact", head: false });

  if (allQuestionsNoLimit.error) {
    throw new Error(`Failed to fetch output_types: ${allQuestionsNoLimit.error.message}`);
  }

  const uniqueOutputTypes = new Set();
  allQuestionsNoLimit.data.forEach(q => {
    if (q.output_type) uniqueOutputTypes.add(q.output_type);
  });

  console.log("\nUnique output_types found:");
  console.log(Array.from(uniqueOutputTypes).sort());
  console.log(`\nTotal unique types: ${uniqueOutputTypes.size}`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

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

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Check a few questions to verify fix
  const testIds = ["two-sum", "palindrome-number", "median-of-two-sorted-arrays"];

  for (const id of testIds) {
    const { data: question, error } = await supabase
      .from("questions")
      .select("id, title, examples, starter_code")
      .eq("id", id)
      .single();

    if (error) {
      console.log(`❌ ${id}: ${error.message}`);
      continue;
    }

    if (!question) {
      console.log(`❌ ${id}: Not found`);
      continue;
    }

    const exampleOutput = question.examples?.[0]?.output;
    const javaCode = question.starter_code?.java || "";

    console.log(`\n✓ ${question.title} (${id})`);
    console.log(`  Example output: ${exampleOutput}`);
    
    // Extract return type from Java code
    const returnMatch = javaCode.match(/public (\w+(?:<[^>]+>)?(?:\[\])?)/);
    const returnType = returnMatch ? returnMatch[1] : "unknown";
    console.log(`  Java return type: ${returnType}`);
    
    // Show a snippet of the code
    const codeSnippet = javaCode.split('\n')[0];
    console.log(`  Code snippet: ${codeSnippet}`);
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

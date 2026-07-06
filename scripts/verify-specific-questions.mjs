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
  const envPath = path.join(process.cwd(), ".env.local");
  return readDotEnvFile(envPath);
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

  // Check specific questions that were reported broken
  const testQuestions = [
    "find-pivot-index",
    "longest-palindromic-substring",
    "string-to-integer-atoi",
    "count-and-say",
    "remove-element",
  ];

  console.log("Verifying specific questions:\n");

  for (const slug of testQuestions) {
    const { data } = await supabase
      .from("questions")
      .select("title, function_name, starter_code")
      .eq("slug", slug)
      .single();

    if (data) {
      const javaCode = data.starter_code?.java || "";
      const lines = javaCode.split("\n").slice(0, 3).join("\n");
      
      console.log(`✓ ${data.title} (${slug})`);
      console.log(`Function: ${data.function_name}`);
      console.log("Java boilerplate:");
      console.log(lines);
      
      // Check for generic returns
      if (javaCode.includes("public Object") || 
          javaCode.includes("public String solve(String")) {
        console.log("  ❌ STILL BROKEN: Generic return type detected");
      } else {
        console.log("  ✓ FIXED: Looks correct");
      }
      console.log();
    }
  }
}

main().catch(console.error);

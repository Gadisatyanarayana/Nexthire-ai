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

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("Analyzing starter_code quality across all 2913 questions...\n");

  // Get all questions
  const { data: totalData, error: countError } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true });

  const totalCount = totalData?.length || 0;
  if (countError) {
    console.error("Error fetching count:", countError.message);
    return;
  }

  // Sample 100 random questions
  const { data: sample, error } = await supabase
    .from("questions")
    .select("id, title, starter_code, examples")
    .limit(100)
    .order("id");

  if (error) {
    console.error("Error fetching sample:", error.message);
    return;
  }

  const typeDistribution = {};
  let correctCount = 0;
  let issueCount = 0;
  const issues = [];

  for (const q of sample) {
    const javaCode = q.starter_code?.java || "";
    const returnMatch = javaCode.match(/public (\w+(?:<[^>]+>)?(?:\[\])*)/);
    const returnType = returnMatch ? returnMatch[1] : "unknown";

    // Track types
    typeDistribution[returnType] = (typeDistribution[returnType] || 0) + 1;

    // Check if generic Object (bad)
    if (returnType === "Object") {
      issueCount++;
      const example = q.examples?.[0]?.output;
      issues.push({
        id: q.id,
        title: q.title,
        returnType,
        exampleOutput: example
      });
    } else {
      correctCount++;
    }
  }

  console.log(`Sample Analysis (100 questions):`);
  console.log(`  ✓ Correctly typed: ${correctCount}`);
  console.log(`  ✗ Generic Object return: ${issueCount}`);
  console.log(`\nReturn Type Distribution:`);
  Object.entries(typeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  if (issues.length > 0) {
    console.log(`\nIssues Found (first 10):`);
    issues.slice(0, 10).forEach(issue => {
      console.log(`  ✗ ${issue.title}`);
      console.log(`    Expected: ${issue.exampleOutput}`);
      console.log(`    Got: Object`);
    });
  } else {
    console.log(`\n✓ All sampled questions have correct return types!`);
  }

  console.log(`\nEstimate for all ${totalCount} questions:`);
  const fixedPercentage = (correctCount / sample.length) * 100;
  console.log(`  ~${fixedPercentage.toFixed(1)}% likely have correct types`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

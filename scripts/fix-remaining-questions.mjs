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

// Improved inference that handles missing examples
function inferReturnTypeFromQuestion(q) {
  // Check examples first
  if (q.examples && Array.isArray(q.examples) && q.examples.length > 0) {
    const output = String(q.examples[0].output || "").trim();
    if (output.match(/^\[\s*\[.*\]\s*\]$/) || output.match(/^\{\{.*\}\}$/)) return "array2d";
    if (output.match(/^\[.*\]$/) || output.match(/^\{.*\}$/)) return "array";
    if (output.match(/^(true|false)$/i)) return "boolean";
    if (output.match(/^-?\d+\.\d+$/)) return "double";
    if (output.match(/^-?\d+$/)) return "int";
    if (output.startsWith('"') || output.startsWith("'")) return "string";
    return "string"; // Default to string for other text
  }

  // Fallback: infer from title/description keywords
  const title = (q.title || "").toLowerCase();
  const desc = (q.description || "").toLowerCase();
  const text = title + " " + desc;

  if (text.includes("count") || text.includes("sum") || text.includes("index") || text.includes("number")) return "int";
  if (text.includes("valid") || text.includes("possible") || text.includes("exist")) return "boolean";
  if (text.includes("string") || text.includes("word")) return "string";
  if (text.includes("matrix") || text.includes("grid") || text.includes("board")) return "array2d";
  if (text.includes("list") || text.includes("array")) return "array";
  
  return "auto"; // Last resort
}

function generateStarterCode(returnType, functionName = "solve") {
  let javaType = "Object", javaReturn = "null";
  let cppType = "auto", cppReturn = "{}";
  let pythonType = "Any", pythonReturn = "None";
  
  if (returnType === "boolean") {
    javaType = "boolean"; javaReturn = "false";
    cppType = "bool"; cppReturn = "false";
    pythonType = "bool"; pythonReturn = "False";
  } else if (returnType === "array2d") {
    javaType = "int[][]"; javaReturn = "new int[0][0]";
    cppType = "vector<vector<int>>"; cppReturn = "{}";
    pythonType = "list[list[int]]"; pythonReturn = "[]";
  } else if (returnType === "array") {
    javaType = "int[]"; javaReturn = "new int[0]";
    cppType = "vector<int>"; cppReturn = "{}";
    pythonType = "list[int]"; pythonReturn = "[]";
  } else if (returnType === "double") {
    javaType = "double"; javaReturn = "0.0";
    cppType = "double"; cppReturn = "0.0";
    pythonType = "float"; pythonReturn = "0.0";
  } else if (returnType === "int") {
    javaType = "int"; javaReturn = "0";
    cppType = "int"; cppReturn = "0";
    pythonType = "int"; pythonReturn = "0";
  } else if (returnType === "string") {
    javaType = "String"; javaReturn = '""';
    cppType = "string"; cppReturn = '""';
    pythonType = "str"; pythonReturn = '""';
  }
  
  return {
    java: `class Solution {\n    public ${javaType} ${functionName}(/* parameters */) {\n        // Write your solution logic here.\n        return ${javaReturn};\n    }\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${cppType} ${functionName}(/* parameters */) {\n        // Write your solution logic here.\n        return ${cppReturn};\n    }\n};`,
    python: `def ${functionName}(/* parameters */) -> ${pythonType}:\n    # Write your solution logic here.\n    return ${pythonReturn}\n`
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("Scanning all questions for incorrect starter_code...\n");
  
  // Fetch ALL questions using pagination
  const allQuestions = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: page, error } = await supabase
      .from("questions")
      .select("id, title, description, examples, function_name, starter_code")
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    if (!page || page.length === 0) break;
    allQuestions.push(...page);
    offset += pageSize;
  }

  console.log(`Total questions found: ${allQuestions.length}\n`);

  const problemQuestions = [];
  let fixed = 0;

  for (const q of allQuestions || []) {
    const javaCode = q.starter_code?.java || "";
    const hasGenericReturn = javaCode.includes("public Object") || javaCode.includes("public String");
    
    if (hasGenericReturn) {
      const inferredType = inferReturnTypeFromQuestion(q);
      const newCode = generateStarterCode(inferredType, q.function_name || "solve");
      
      problemQuestions.push({
        id: q.id,
        title: q.title,
        inferredType,
        newCode
      });
      fixed++;
      
      if (fixed <= 20) {
        console.log(`[ISSUE] ${q.title} (${q.id})`);
        console.log(`  Inferred: ${inferredType}`);
        console.log(`  Old: ${javaCode.split('\n')[0]}`);
        console.log(`  New: ${newCode.java.split('\n')[0]}`);
      }
    }
  }

  console.log(`\n✓ Found ${fixed} questions with incorrect starter_code\n`);

  if (dryRun) {
    console.log("Dry-run mode: no updates");
    return;
  }

  console.log(`Updating ${problemQuestions.length} questions...\n`);

  let success = 0;
  let failed = 0;

  for (const q of problemQuestions) {
    const { error: updateError } = await supabase
      .from("questions")
      .update({ starter_code: q.newCode })
      .eq("id", q.id);

    if (updateError) {
      console.log(`  ✗ ${q.id}: ${updateError.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\nCompleted: ${success} fixed, ${failed} failed`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

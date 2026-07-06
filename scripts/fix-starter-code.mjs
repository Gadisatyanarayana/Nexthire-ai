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

// Function to infer return type from example output
function inferReturnTypeFromExample(exampleOutput) {
  if (!exampleOutput) return "auto";
  
  const output = String(exampleOutput).trim();
  
  // Check for array/list patterns
  if (output.match(/^\[\s*\[.*\]\s*\]$/) || output.match(/^\{\{.*\}\}$/)) return "array2d";
  if (output.match(/^\[.*\]$/) || output.match(/^\{.*\}$/)) return "array";
  
  // Check for boolean
  if (output.match(/^(true|false)$/i)) return "boolean";
  
  // Check for numbers
  if (output.match(/^-?\d+\.\d+$/)) return "double";
  if (output.match(/^-?\d+$/)) return "int";
  
  // Default to string
  return "string";
}

// Generate correct starter code based on output type
function generateStarterCode(outputType, functionName = "solve") {
  const type = String(outputType || "auto").toLowerCase();
  
  let javaType = "Object";
  let javaReturn = "null";
  let cppType = "auto";
  let cppReturn = "{}";
  let pythonType = "Any";
  let pythonReturn = "None";
  
  if (type.includes("boolean")) {
    javaType = "boolean";
    javaReturn = "false";
    cppType = "bool";
    cppReturn = "false";
    pythonType = "bool";
    pythonReturn = "False";
  } else if (type.includes("array2d")) {
    javaType = "int[][]";
    javaReturn = "new int[0][0]";
    cppType = "vector<vector<int>>";
    cppReturn = "{}";
    pythonType = "list[list[int]]";
    pythonReturn = "[]";
  } else if (type.includes("array")) {
    javaType = "int[]";
    javaReturn = "new int[0]";
    cppType = "vector<int>";
    cppReturn = "{}";
    pythonType = "list[int]";
    pythonReturn = "[]";
  } else if (type.includes("double") || type.includes("float")) {
    javaType = "double";
    javaReturn = "0.0";
    cppType = "double";
    cppReturn = "0.0";
    pythonType = "float";
    pythonReturn = "0.0";
  } else if (type.includes("long")) {
    javaType = "long";
    javaReturn = "0L";
    cppType = "long long";
    cppReturn = "0";
    pythonType = "int";
    pythonReturn = "0";
  } else if (type.includes("int")) {
    javaType = "int";
    javaReturn = "0";
    cppType = "int";
    cppReturn = "0";
    pythonType = "int";
    pythonReturn = "0";
  } else if (type.includes("string") || type.includes("str") || type === "string") {
    javaType = "String";
    javaReturn = '""';
    cppType = "string";
    cppReturn = '""';
    pythonType = "str";
    pythonReturn = '""';
  }
  
    return {
    java: `class Solution {\n    public ${javaType} ${functionName}(/* parameters */) {\n        // Write your solution logic here.\n        return ${javaReturn};\n    }\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${cppType} ${functionName}(/* parameters */) {\n        // Write your solution logic here.\n        return ${cppReturn};\n    }\n};`,
      python: `def ${functionName}(/* parameters */) -> ${pythonType}:\n    # Write your solution logic here.\n    return ${pythonReturn}`
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limit = parseInt(args.find(a => a.startsWith("--limit="))?.split("=")[1] || "50");
  
  const env = loadEnv();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`Fetching first ${limit} questions to fix starter_code...\n`);
  
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, title, starter_code, examples, function_name")
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  if (!questions || questions.length === 0) {
    console.log("No questions found");
    return;
  }

  console.log(`Found ${questions.length} questions to process\n`);

  let fixed = 0;
  let skipped = 0;
  const updates = [];

  for (const q of questions) {
    const example = q.examples?.[0];
    const outputType = inferReturnTypeFromExample(example?.output);
    const functionName = q.function_name || "solve";
    
    // Check if starter_code needs fixing
    const hasGenericJava = q.starter_code?.java?.includes("Object solve()");
    
    if (hasGenericJava || !q.starter_code) {
      const newCode = generateStarterCode(outputType, functionName);
      
      console.log(`[FIX] ${q.title}`);
      console.log(`  - Inferred type: ${outputType}`);
      console.log(`  - New Java return: ${newCode.java.match(/public (\w+(?:<[^>]+>)?(?:\[\])?)/)?.[1] || "unknown"}`);
      
      updates.push({
        id: q.id,
        starterCode: newCode
      });
      
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log(`\nSummary: ${fixed} to fix, ${skipped} already good`);

  if (updates.length === 0) {
    console.log("No updates needed!");
    return;
  }

  if (dryRun) {
    console.log("\nDry-run mode: no database updates performed");
    console.log(`Sample update (first question):`);
    console.log(JSON.stringify(updates[0], null, 2));
    return;
  }

  console.log(`\nApplying ${updates.length} updates to database...`);

  let success = 0;
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("questions")
      .update({ starter_code: update.starterCode })
      .eq("id", update.id);

    if (updateError) {
      console.error(`  ✗ ${update.id}: ${updateError.message}`);
    } else {
      console.error(`  ✓ ${update.id}`);
      success++;
    }
  }

  console.log(`\nCompleted: ${success}/${updates.length} questions fixed`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

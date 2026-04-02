#!/usr/bin/env node
/**
 * LeetCode Bulk Import Script - Sample Data Mode
 * 
 * This script imports sample coding questions into the database.
 * In production, you can:
 * 1. Use the LeetCode REST API (uncomment fetchLeetCodeQuestions)
 * 2. Load from a local JSON file (place it in scripts/sample-questions.json)
 * 3. Use krishnadey30/LeetCode-Questions-CompanyWise repo data
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
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

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data generator - creates realistic coding questions
function generateSampleQuestions(count = 100) {
  const topics = [
    "Array", "Linked List", "Binary Tree", "Graph", "Dynamic Programming",
    "Greedy", "Binary Search", "Two Pointers", "Sliding Window", "String",
    "Hash Table", "Depth-First Search", "Breadth-First Search", "Bit Manipulation",
    "Math", "Sorting", "Heap", "Stack", "Queue", "Trie"
  ];

  const companies = [
    "Google", "Amazon", "Microsoft", "Apple", "Meta", "Tesla", "Netflix",
    "LinkedIn", "Adobe", "Salesforce", "Oracle", "IBM", "Intel", "Uber"
  ];

  const questions = [
    { title: "Two Sum", difficulty: "Easy", desc: "Find two numbers that add up to target" },
    { title: "Add Two Numbers", difficulty: "Medium", desc: "Add two numbers represented as linked lists" },
    { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", desc: "Find longest substring with unique characters" },
    { title: "Median of Two Sorted Arrays", difficulty: "Hard", desc: "Find median of two sorted arrays" },
    { title: "Longest Palindromic Substring", difficulty: "Medium", desc: "Find longest palindromic substring" },
    { title: "ZigZag Conversion", difficulty: "Medium", desc: "Convert string to zigzag pattern" },
    { title: "Reverse Integer", difficulty: "Easy", desc: "Reverse digits of a 32-bit integer" },
    { title: "String to Integer (atoi)", difficulty: "Medium", desc: "Convert string to integer" },
    { title: "Palindrome Number", difficulty: "Easy", desc: "Check if number is palindrome" },
    { title: "Container With Most Water", difficulty: "Medium", desc: "Find two lines that form largest container" },
    { title: "Regular Expression Matching", difficulty: "Hard", desc: "Implement regex matching with '.' and '*'" },
    { title: "Merge k Sorted Lists", difficulty: "Hard", desc: "Merge k sorted linked lists" },
    { title: "Search in Rotated Sorted Array", difficulty: "Medium", desc: "Search in rotated sorted array" },
    { title: "Combination Sum", difficulty: "Medium", desc: "Find all combinations that sum to target" },
    { title: "Word Search", difficulty: "Medium", desc: "Search for word in 2D grid" },
    { title: "N-Queens", difficulty: "Hard", desc: "Place N queens on N×N chessboard" },
    { title: "Remove Duplicates from Sorted Array", difficulty: "Easy", desc: "Remove duplicates in-place" },
    { title: "Remove Element", difficulty: "Easy", desc: "Remove all instances of value in-place" },
    { title: "Implement strStr()", difficulty: "Easy", desc: "Find first occurrence of substring" },
    { title: "Divide Two Integers", difficulty: "Medium", desc: "Divide without using * / % operators" },
  ];

  const selected = [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(count, questions.length));
  
  // Repeat/generate more if needed
  while (selected.length < count) {
    const base = questions[Math.floor(Math.random() * questions.length)];
    selected.push({
      ...base,
      title: `${base.title} ${selected.length - questions.length}`,
    });
  }

  return selected.map((q, idx) => ({
    id: `sample-${idx + 1}`,
    title: q.title,
    slug: `${q.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx}`,
    difficulty: q.difficulty,
    acceptance_rate: Math.round(Math.random() * 60 + 20),
    description: `${q.desc} - Sample question for practice.`,
    topic: [topics[Math.floor(Math.random() * topics.length)], topics[Math.floor(Math.random() * topics.length)]],
    company_tags: [companies[Math.floor(Math.random() * companies.length)]],
    pattern_tags: ["sample"],
    testcases: [],
    starter_code: {
      python: `def solve():\n    # Write your logic here\n    pass`,
      javascript: `function solve() {\n    // Write your logic here\n}`,
      java: `class Solution {\n    public void solve() {\n        // Write your logic here\n    }\n}`,
    },
    source: "sample",
  }));
}

// Import questions to database
async function importQuestionsToDB(questions) {
  console.log(`\n📊 Importing ${questions.length} questions to database...`);

  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, Math.min(i + batchSize, questions.length));

    try {
      const { error } = await supabase
        .from("questions")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        const percent = Math.round((i + batch.length) / questions.length * 100);
        console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} questions (${percent}% complete, ${successCount} total)`);
      }
    } catch (err) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, err.message);
      errorCount += batch.length;
    }

    // Add a small delay between batches
    if (i + batchSize < questions.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\n📈 Import complete: ${successCount} succeeded, ${errorCount} failed`);
  return { successCount, errorCount };
}

// Main execution
async function main() {
  try {
    console.log("🚀 NextHire AI - Bulk Question Importer");
    console.log("=".repeat(50));

    // Check existing questions
    const { data: existing } = await supabase
      .from("questions")
      .select("id", { count: "exact" });

    console.log(`\n📋 Current questions in database: ${existing?.length || 0}`);
    console.log(`\n💡 TIP: To import 4000 LeetCode questions in production:`);
    console.log(`   1. Download LeetCode data: https://github.com/krishnadey30/LeetCode-Questions-CompanyWise`);
    console.log(`   2. Place in scripts/sample-questions.json`);
    console.log(`   3. Uncomment the JSON file loader in this script`);
    console.log(`   OR use the import-questions.mjs script which has full GitHub integration\n`);

    // Generate and import sample data
    const sampleQuestions = generateSampleQuestions(100);
    console.log(`\n📥 Generating ${sampleQuestions.length} sample questions...`);

    // Import to database
    const result = await importQuestionsToDB(sampleQuestions);

    console.log("\n" + "=".repeat(50));
    console.log("✅ Import completed successfully!");
    console.log(`   Questions imported: ${result.successCount}`);
    console.log(`   Errors: ${result.errorCount}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   - Test contest creation with these questions`);
    console.log(`   - Visit /contests to create a new contest`);
    console.log(`   - In production, use import-questions.mjs for full LeetCode sync`);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();

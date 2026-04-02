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

const envFromFile = readDotEnvFile(path.join(process.cwd(), ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envFromFile.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envFromFile.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 100 popular LeetCode questions with company tags
const questions = [
  // Easy - Array
  { id: "1", title: "Two Sum", difficulty: "Easy", topic: ["array", "hash-map"], companies: ["Amazon", "Google", "Microsoft"], acceptance_rate: 48 },
  { id: "121", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: ["array", "dynamic-programming"], companies: ["Amazon", "Google"], acceptance_rate: 51 },
  { id: "217", title: "Contains Duplicate", difficulty: "Easy", topic: ["array", "hash-set"], companies: ["Amazon", "Uber"], acceptance_rate: 60 },
  { id: "242", title: "Valid Anagram", difficulty: "Easy", topic: ["hash-map", "string"], companies: ["Uber", "Airbnb"], acceptance_rate: 65 },
  { id: "347", title: "Top K Frequent Elements", difficulty: "Medium", topic: ["array", "heap", "hash-map"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 61 },
  
  // Easy - String
  { id: "20", title: "Valid Parentheses", difficulty: "Easy", topic: ["stack", "string"], companies: ["Amazon", "Google"], acceptance_rate: 40 },
  { id: "125", title: "Valid Palindrome", difficulty: "Easy", topic: ["string", "two-pointers"], companies: ["Facebook", "Microsoft"], acceptance_rate: 42 },
  { id: "226", title: "Invert Binary Tree", difficulty: "Easy", topic: ["tree", "dfs"], companies: ["Amazon", "Google"], acceptance_rate: 73 },
  { id: "235", title: "Lowest Common Ancestor of a BST", difficulty: "Easy", topic: ["tree", "binary-search-tree"], companies: ["Amazon", "Facebook"], acceptance_rate: 56 },
  { id: "206", title: "Reverse Linked List", difficulty: "Easy", topic: ["linked-list"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 60 },
  
  // Medium - Array
  { id: "33", title: "Search in Rotated Sorted Array", difficulty: "Medium", topic: ["array", "binary-search"], companies: ["Google", "Microsoft"], acceptance_rate: 33 },
  { id: "48", title: "Rotate Image", difficulty: "Medium", topic: ["array", "matrix"], companies: ["Amazon", "Microsoft"], acceptance_rate: 56 },
  { id: "54", title: "Spiral Matrix", difficulty: "Medium", topic: ["array", "matrix"], companies: ["Amazon", "Microsoft"], acceptance_rate: 38 },
  { id: "56", title: "Merge Intervals", difficulty: "Medium", topic: ["array", "sorting"], companies: ["Google", "Amazon"], acceptance_rate: 43 },
  { id: "152", title: "Maximum Product Subarray", difficulty: "Medium", topic: ["array", "dynamic-programming"], companies: ["Google", "Airbnb"], acceptance_rate: 32 },
  
  // Medium - String
  { id: "3", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: ["string", "sliding-window"], companies: ["Amazon", "Google"], acceptance_rate: 33 },
  { id: "5", title: "Longest Palindromic Substring", difficulty: "Medium", topic: ["string", "dynamic-programming"], companies: ["Amazon", "Microsoft"], acceptance_rate: 32 },
  { id: "49", title: "Group Anagrams", difficulty: "Medium", topic: ["hash-map", "string"], companies: ["Amazon", "Google"], acceptance_rate: 60 },
  { id: "76", title: "Minimum Window Substring", difficulty: "Hard", topic: ["string", "sliding-window"], companies: ["Google", "Amazon"], acceptance_rate: 33 },
  { id: "438", title: "Find All Anagrams in a String", difficulty: "Medium", topic: ["string", "hash-map"], companies: ["Amazon", "Microsoft"], acceptance_rate: 50 },
  
  // Medium - Dynamic Programming
  { id: "70", title: "Climbing Stairs", difficulty: "Easy", topic: ["dynamic-programming"], companies: ["Amazon", "Google"], acceptance_rate: 51 },
  { id: "198", title: "House Robber", difficulty: "Medium", topic: ["dynamic-programming"], companies: ["Amazon", "Google", "Microsoft"], acceptance_rate: 42 },
  { id: "213", title: "House Robber II", difficulty: "Medium", topic: ["dynamic-programming"], companies: ["Amazon", "Microsoft"], acceptance_rate: 36 },
  { id: "300", title: "Longest Increasing Subsequence", difficulty: "Medium", topic: ["dynamic-programming", "array"], companies: ["Amazon", "Google"], acceptance_rate: 45 },
  { id: "62", title: "Unique Paths", difficulty: "Medium", topic: ["dynamic-programming", "matrix"], companies: ["Amazon", "Google"], acceptance_rate: 59 },
  
  // Medium - Tree
  { id: "94", title: "Binary Tree Inorder Traversal", difficulty: "Easy", topic: ["tree", "dfs"], companies: ["Amazon", "Google"], acceptance_rate: 66 },
  { id: "102", title: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: ["tree", "bfs"], companies: ["Amazon", "Google"], acceptance_rate: 60 },
  { id: "105", title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", topic: ["tree"], companies: ["Amazon", "Google"], acceptance_rate: 53 },
  { id: "236", title: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium", topic: ["tree", "dfs"], companies: ["Amazon", "Google"], acceptance_rate: 58 },
  { id: "297", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: ["tree"], companies: ["Amazon", "Google"], acceptance_rate: 52 },
  
  // Medium - Linked List
  { id: "2", title: "Add Two Numbers", difficulty: "Medium", topic: ["linked-list", "math"], companies: ["Amazon", "Google"], acceptance_rate: 33 },
  { id: "19", title: "Remove Nth Node From End of List", difficulty: "Medium", topic: ["linked-list", "two-pointers"], companies: ["Amazon", "Google"], acceptance_rate: 35 },
  { id: "141", title: "Linked List Cycle", difficulty: "Easy", topic: ["linked-list", "two-pointers"], companies: ["Amazon", "Google"], acceptance_rate: 48 },
  { id: "160", title: "Intersection of Two Linked Lists", difficulty: "Easy", topic: ["linked-list"], companies: ["Amazon", "Google"], acceptance_rate: 52 },
  { id: "24", title: "Swap Nodes in Pairs", difficulty: "Medium", topic: ["linked-list"], companies: ["Amazon", "Google"], acceptance_rate: 56 },
  
  // Hard - Array
  { id: "4", title: "Median of Two Sorted Arrays", difficulty: "Hard", topic: ["array", "binary-search"], companies: ["Google", "Facebook"], acceptance_rate: 27 },
  { id: "42", title: "Trapping Rain Water", difficulty: "Hard", topic: ["array", "two-pointers"], companies: ["Amazon", "Microsoft"], acceptance_rate: 53 },
  { id: "84", title: "Largest Rectangle in Histogram", difficulty: "Hard", topic: ["array", "stack"], companies: ["Amazon", "Google"], acceptance_rate: 37 },
  { id: "239", title: "Sliding Window Maximum", difficulty: "Hard", topic: ["array", "sliding-window", "heap"], companies: ["Amazon", "Google"], acceptance_rate: 42 },
  
  // Hard - String
  { id: "10", title: "Regular Expression Matching", difficulty: "Hard", topic: ["string", "dynamic-programming"], companies: ["Google", "Facebook"], acceptance_rate: 26 },
  { id: "44", title: "Wildcard Matching", difficulty: "Hard", topic: ["string", "dynamic-programming"], companies: ["Google", "Amazon"], acceptance_rate: 23 },
  { id: "72", title: "Edit Distance", difficulty: "Hard", topic: ["dynamic-programming", "string"], companies: ["Google", "Amazon"], acceptance_rate: 50 },
  
  // Hard - Tree
  { id: "124", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", topic: ["tree", "dfs"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 37 },
  { id: "145", title: "Binary Tree Postorder Traversal", difficulty: "Easy", topic: ["tree", "dfs"], companies: ["Amazon", "Google"], acceptance_rate: 58 },
  
  // More variety
  { id: "15", title: "3Sum", difficulty: "Medium", topic: ["array", "two-pointers"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 32 },
  { id: "16", title: "3Sum Closest", difficulty: "Medium", topic: ["array", "two-pointers"], companies: ["Amazon", "Google"], acceptance_rate: 46 },
  { id: "18", title: "4Sum", difficulty: "Medium", topic: ["array", "two-pointers"], companies: ["Amazon", "Google"], acceptance_rate: 35 },
  { id: "11", title: "Container With Most Water", difficulty: "Medium", topic: ["array", "two-pointers"], companies: ["Amazon", "Google"], acceptance_rate: 52 },
  { id: "31", title: "Next Permutation", difficulty: "Medium", topic: ["array"], companies: ["Google", "Amazon"], acceptance_rate: 35 },
  { id: "34", title: "Find First and Last Position of Element in Sorted Array", difficulty: "Medium", topic: ["array", "binary-search"], companies: ["Amazon", "Google"], acceptance_rate: 38 },
  { id: "39", title: "Combination Sum", difficulty: "Medium", topic: ["array", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 65 },
  { id: "40", title: "Combination Sum II", difficulty: "Medium", topic: ["array", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 52 },
  { id: "46", title: "Permutations", difficulty: "Medium", topic: ["array", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 76 },
  { id: "47", title: "Permutations II", difficulty: "Medium", topic: ["array", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 58 },
  { id: "78", title: "Subsets", difficulty: "Medium", topic: ["array", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 79 },
  { id: "90", title: "Subsets II", difficulty: "Medium", topic: ["array", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 52 },
  { id: "131", title: "Palindrome Partitioning", difficulty: "Medium", topic: ["string", "backtracking"], companies: ["Google", "Amazon"], acceptance_rate: 63 },
  { id: "17", title: "Letter Combinations of a Phone Number", difficulty: "Medium", topic: ["string", "backtracking"], companies: ["Amazon", "Google"], acceptance_rate: 54 },
  { id: "22", title: "Generate Parentheses", difficulty: "Medium", topic: ["string", "backtracking"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 72 },
  { id: "79", title: "Word Search", difficulty: "Medium", topic: ["array", "dfs"], companies: ["Amazon", "Google"], acceptance_rate: 35 },
  { id: "212", title: "Word Search II", difficulty: "Hard", topic: ["array", "dfs", "trie"], companies: ["Amazon", "Google"], acceptance_rate: 33 },
  { id: "127", title: "Word Ladder", difficulty: "Hard", topic: ["string", "bfs"], companies: ["Amazon", "Google"], acceptance_rate: 37 },
  { id: "51", title: "N-Queens", difficulty: "Hard", topic: ["backtracking"], companies: ["Google", "Microsoft"], acceptance_rate: 60 },
  { id: "200", title: "Number of Islands", difficulty: "Medium", topic: ["dfs", "bfs", "matrix"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 57 },
  { id: "207", title: "Course Schedule", difficulty: "Medium", topic: ["graph", "topological-sort"], companies: ["Amazon", "Google"], acceptance_rate: 50 },
  { id: "208", title: "Implement Trie (Prefix Tree)", difficulty: "Medium", topic: ["trie", "design"], companies: ["Amazon", "Google"], acceptance_rate: 60 },
  { id: "211", title: "Design Add and Search Words Data Structure", difficulty: "Medium", topic: ["trie"], companies: ["Amazon", "Google"], acceptance_rate: 38 },
  { id: "271", title: "Encode and Decode Strings", difficulty: "Medium", topic: ["string"], companies: ["Google", "Amazon"], acceptance_rate: 64 },
  { id: "273", title: "Integer to English Words", difficulty: "Hard", topic: ["string", "math"], companies: ["Google", "Amazon"], acceptance_rate: 27 },
  { id: "23", title: "Merge k Sorted Lists", difficulty: "Hard", topic: ["linked-list", "heap"], companies: ["Amazon", "Google"], acceptance_rate: 44 },
  { id: "25", title: "Reverse Nodes in k-Group", difficulty: "Hard", topic: ["linked-list"], companies: ["Amazon", "Google"], acceptance_rate: 48 },
  { id: "146", title: "LRU Cache", difficulty: "Medium", topic: ["design", "hash-map"], companies: ["Amazon", "Google", "Facebook"], acceptance_rate: 33 },
  { id: "155", title: "Min Stack", difficulty: "Easy", topic: ["stack", "design"], companies: ["Amazon", "Google"], acceptance_rate: 50 },
  { id: "232", title: "Implement Queue using Stacks", difficulty: "Easy", topic: ["stack", "queue", "design"], companies: ["Amazon", "Google"], acceptance_rate: 60 },
  { id: "341", title: "Flatten Nested List Iterator", difficulty: "Medium", topic: ["stack", "design"], companies: ["Google", "Amazon"], acceptance_rate: 56 },
];

async function seed() {
  try {
    console.log(`Seeding ${questions.length} questions...`);
    
    // Prepare questions for insertion
    const questionsToInsert = questions.map((q) => ({
      id: String(q.id),
      title: q.title,
      difficulty: q.difficulty,
      topic: q.topic,
      description: `This is a ${q.difficulty} level problem on LeetCode covering ${q.topic.join(", ")} concepts.`,
      company_tags: q.companies,
      pattern_tags: [],
      acceptance_rate: q.acceptance_rate,
      slug: q.title.toLowerCase().replace(/\s+/g, "-"),
      source: "leetcode",
      examples: [
        { input: "example input", output: "example output", explanation: "This is how it works" },
      ],
      testcases: [
        { input: "test input 1", expectedOutput: "expected output 1" },
        { input: "test input 2", expectedOutput: "expected output 2" },
      ],
      starter_code: {
        python: "def solution():\n    pass",
        java: "class Solution {}\n    public void solution() {}\n}",
        cpp: "void solution() {\n    // Your code here\n}",
      },
    }));

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from("questions").upsert(batch, { onConflict: "id" });
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} questions)`);
      }
    }

    console.log(`✓ Seeding complete! ${questions.length} questions added.`);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [key, ...rest] = line.split("=");
    out[key.trim()] = rest.join("=").trim();
  }
  return out;
}

const env = { ...readEnv(".env.example"), ...readEnv(".env.local"), ...process.env };
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const questions = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You must use each input exactly once, and cannot use the same element twice.",
    topic: ["array", "hash-table"],
    company_tags: ["Amazon", "Google", "Microsoft"],
    testcases: [
      { input: "[2,7,11,15], target=9", expectedOutput: "[0,1]" },
      { input: "[3,2,4], target=6", expectedOutput: "[1,2]" },
    ],
    examples: [
      { input: "[2,7,11,15], target=9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
      { input: "[3,3], target=6", output: "[0,1]", explanation: "nums[0] + nums[1] == 6" },
    ],
    function_name: "twoSum",
    input_type: "int[], int",
    output_type: "int[]",
    starter_code: {
      python: "def twoSum(nums, target):\n    pass",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}",
    },
    section: "Arrays",
    acceptance_rate: 48,
  },
  {
    id: "20",
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: 1. Open brackets are closed by the same type of brackets. 2. Open brackets are closed in the correct order.",
    topic: ["stack", "string"],
    company_tags: ["Amazon", "Google", "Microsoft"],
    testcases: [
      { input: '"()"', expectedOutput: "true" },
      { input: '"()[]{}"', expectedOutput: "true" },
      { input: '"(]"', expectedOutput: "false" },
    ],
    examples: [
      { input: '"()"', output: "true", explanation: "Valid parentheses" },
      { input: '"([])"', output: "true", explanation: "Valid nested parentheses" },
    ],
    function_name: "isValid",
    input_type: "string",
    output_type: "boolean",
    starter_code: {
      python: "def isValid(s: str) -> bool:\n    pass",
      cpp: "bool isValid(string s) {\n    return false;\n}",
      java: "class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}",
    },
    section: "Stack",
    acceptance_rate: 40,
  },
  {
    id: "121",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction.",
    topic: ["array", "dynamic-programming"],
    company_tags: ["Amazon", "Google", "Facebook"],
    testcases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
      { input: "[7,6,4,3,1]", expectedOutput: "0" },
    ],
    examples: [
      { input: "[7,1,5,3,6,4]", output: "5", explanation: "Buy at 1, sell at 6, profit = 5" },
      { input: "[2,4,1]", output: "2", explanation: "Buy at 2, sell at 4, profit = 2" },
    ],
    function_name: "maxProfit",
    input_type: "int[]",
    output_type: "int",
    starter_code: {
      python: "def maxProfit(prices):\n    pass",
      cpp: "int maxProfit(vector<int>& prices) {\n    return 0;\n}",
      java: "class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}",
    },
    section: "Arrays",
    acceptance_rate: 51,
  },
  {
    id: "94",
    title: "Binary Tree Inorder Traversal",
    difficulty: "Easy",
    description: "Given the root of a binary tree, return the inorder traversal of its nodes (left, root, right). You must solve this both recursively and iteratively.",
    topic: ["tree", "dfs", "stack"],
    company_tags: ["Amazon", "Google", "Microsoft"],
    testcases: [
      { input: "[1,null,2]", expectedOutput: "[1,2]" },
      { input: "[]", expectedOutput: "[]" },
    ],
    examples: [
      { input: "[1,2,3]", output: "[2,1,3]", explanation: "Inorder: left, root, right" },
    ],
    function_name: "inorderTraversal",
    input_type: "TreeNode",
    output_type: "List<Integer>",
    starter_code: {
      python: "def inorderTraversal(root):\n    pass",
      cpp: "vector<int> inorderTraversal(TreeNode* root) {\n    return {};\n}",
      java: "class Solution {\n    public List<Integer> inorderTraversal(TreeNode root) {\n        return new ArrayList<>();\n    }\n}",
    },
    section: "Trees",
    acceptance_rate: 66,
  },
];

console.log(`Seeding ${questions.length} questions...`);

for (const q of questions) {
  try {
    const { data, error } = await supabase.from("questions").insert([q]).select();
    if (error) {
      console.log(`Error inserting "${q.title}":`, error.message);
    } else {
      console.log(`✓ Inserted: "${q.title}"`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

console.log("\nSeeding complete! Refresh your page to see questions.");

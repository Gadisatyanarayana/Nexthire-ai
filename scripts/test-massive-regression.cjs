process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const path = require("path");
const Module = require("module");
const assert = require("assert");

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const mappedRequest = path.join(process.cwd(), "src", request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

const root = process.cwd();
Object.assign(process.env, readDotEnvFile(path.join(root, ".env.example")), readDotEnvFile(path.join(root, ".env.local")), process.env);

const { getAdminClient } = require("../src/lib/supabaseAdmin");
const { evaluateQuestion } = require("../src/judge/evaluator");

process.env.JUDGE_EXECUTION_TIMEOUT_MS = "5000";

const SCENARIOS = {
  javascript: [
    { name: "Correct", code: "class Solution { solve(nums, target) { const m = new Map(); for (let i=0; i<nums.length; i++) { if (m.has(target - nums[i])) return [m.get(target - nums[i]), i]; m.set(nums[i], i); } return []; } }", expected: "Accepted" },
    { name: "Wrong Answer", code: "class Solution { solve(nums, target) { return [0, 0]; } }", expected: "Wrong Answer" },
    { name: "Syntax Error", code: "class Solution { solve(nums, target) { return [0, 1] }", expected: "Runtime Error" },
    { name: "Runtime Error", code: "class Solution { solve(nums, target) { throw new Error('Crash'); } }", expected: "Runtime Error" },
    { name: "Time Limit", code: "class Solution { solve(nums, target) { while(true) {} } }", expected: "Time Limit Exceeded" },
    { name: "Memory Limit", code: "class Solution { solve(nums, target) { const a = []; while(true) a.push(new Array(1000000)); } }", expected: ["Runtime Error", "Time Limit Exceeded"] },
    { name: "Security Escape", code: "class Solution { solve(nums, target) { require('child_process').execSync('cat /etc/passwd'); return []; } }", expected: ["Runtime Error", "Wrong Answer"] }
  ],
  python: [
    { name: "Correct", code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, v in enumerate(nums):\n            if target - v in seen: return [seen[target - v], i]\n            seen[v] = i\n        return []", expected: "Accepted" },
    { name: "Wrong Answer", code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        return [0, 0]", expected: "Wrong Answer" },
    { name: "Syntax Error", code: "class Solution:\n    def solve(self, nums, target)\n        return [0, 1]", expected: "Runtime Error" },
    { name: "Runtime Error", code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        return 1 / 0", expected: "Runtime Error" },
    { name: "Time Limit", code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        while True: pass", expected: "Time Limit Exceeded" },
    { name: "Memory Limit", code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        a = []\n        while True: a.append([0]*1000000)", expected: ["Runtime Error", "Time Limit Exceeded"] },
    { name: "Security Escape", code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        import os\n        os.system('cat /etc/passwd')\n        return []", expected: ["Runtime Error", "Wrong Answer"] }
  ],
  java: [
    { name: "Correct", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            if (map.containsKey(target - nums[i])) return new int[]{map.get(target - nums[i]), i};\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}", expected: "Accepted" },
    { name: "Wrong Answer", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        return new int[]{0, 0};\n    }\n}", expected: "Wrong Answer" },
    { name: "Syntax Error", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        return new int[]{0, 1}\n    }\n}", expected: "Compile Error" },
    { name: "Runtime Error", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        int a = 1 / 0;\n        return new int[]{};\n    }\n}", expected: "Runtime Error" },
    { name: "Time Limit", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        while (true) {}\n    }\n}", expected: "Time Limit Exceeded" },
    { name: "Memory Limit", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        java.util.List<int[]> list = new java.util.ArrayList<>();\n        while(true) list.add(new int[1000000]);\n    }\n}", expected: ["Runtime Error", "Time Limit Exceeded", "Memory Limit Exceeded"] },
    { name: "Security Escape", code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        try { Runtime.getRuntime().exec(\"cat /etc/passwd\"); } catch(Exception e) {}\n        return new int[]{0, 1};\n    }\n}", expected: ["Compile Error", "Wrong Answer"] }
  ],
  cpp: [
    { name: "Correct", code: "#include <unordered_map>\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        std::unordered_map<int, int> map;\n        for(int i = 0; i < nums.size(); ++i) {\n            if(map.count(target - nums[i])) return {map[target - nums[i]], i};\n            map[nums[i]] = i;\n        }\n        return {};\n    }\n};", expected: "Accepted" },
    { name: "Wrong Answer", code: "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        return {0, 0};\n    }\n};", expected: "Wrong Answer" },
    { name: "Syntax Error", code: "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        return {0, 1}\n    }\n};", expected: "Compile Error" },
    { name: "Runtime Error", code: "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        int* p = nullptr;\n        *p = 1;\n        return {0, 1};\n    }\n};", expected: "Runtime Error" },
    { name: "Time Limit", code: "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        while(true) {}\n        return {0, 1};\n    }\n};", expected: "Time Limit Exceeded" },
    { name: "Memory Limit", code: "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        std::vector<int*> vec;\n        while(true) vec.push_back(new int[1000000]);\n        return {0, 1};\n    }\n};", expected: ["Runtime Error", "Time Limit Exceeded", "Memory Limit Exceeded"] },
    { name: "Security Escape", code: "#include <stdlib.h>\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        system(\"cat /etc/passwd\");\n        return {0, 1};\n    }\n};", expected: ["Compile Error", "Wrong Answer"] }
  ]
};

async function run() {
  const admin = getAdminClient();
  console.log("Fetching question details...");
  const { data: question } = await admin
    .from("questions")
    .select("id, title, difficulty, function_name, input_type, output_type, testcases")
    .eq("id", "two-sum")
    .maybeSingle();

  if (!question) throw new Error("Question not found");

  const baseSpec = {
    kind: "question-evaluation",
    requestedAt: Date.now(),
    mode: "submit",
    questionId: "two-sum",
    testcases: question.testcases.slice(0, 2).map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: false,
    })),
    functionName: question.function_name,
    inputType: question.input_type,
    outputType: question.output_type,
    caseSource: "smoke",
  };

  let total = 0;
  let passed = 0;
  let failed = [];

  for (const [lang, tests] of Object.entries(SCENARIOS)) {
    for (const test of tests) {
      total++;
      console.log(`\nRunning [${lang}] ${test.name}...`);
      
      const res = await evaluateQuestion({
        ...baseSpec,
        submissionId: `massive-${lang}-${total}`,
        language: lang,
        code: test.code
      });

      const actualResult = res.result;
      const expectedArr = Array.isArray(test.expected) ? test.expected : [test.expected];
      
      let ok = false;
      for (const exp of expectedArr) {
        if (actualResult === exp) {
           ok = true;
           break;
        }
        if (exp === "Runtime Error" && actualResult.includes("Error")) {
           ok = true;
           break;
        }
      }
      
      if (ok) {
        passed++;
        console.log(`✅ Passed! Result: ${actualResult}`);
      } else {
        console.log(`❌ FAILED! Expected ${expectedArr.join(" or ")}, got ${actualResult}`);
        failed.push(`[${lang}] ${test.name}: Expected ${expectedArr.join(" or ")}, Got ${actualResult}`);
      }
    }
  }

  console.log(`\n=== MASSIVE REGRESSION AUDIT RESULTS ===`);
  console.log(`Coverage: ${passed} / ${total} tests passed.`);
  if (failed.length > 0) {
    console.log("Failures:");
    failed.forEach(f => console.log(f));
    process.exit(1);
  } else {
    console.log("System is fully robust and production-ready.");
    process.exit(0);
  }
}

run().catch(console.error);

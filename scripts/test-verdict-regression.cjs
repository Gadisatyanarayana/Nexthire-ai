process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const path = require("path");
const Module = require("module");
const assert = require("assert");

// Alias support for @/ imports
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const mappedRequest = path.join(process.cwd(), "src", request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

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

const root = process.cwd();
const localEnv = readDotEnvFile(path.join(root, ".env.local"));
const exampleEnv = readDotEnvFile(path.join(root, ".env.example"));
Object.assign(process.env, exampleEnv, localEnv, process.env);
process.env.JUDGE_EXECUTION_TIMEOUT_MS = "20000";

const { getAdminClient } = require("../src/lib/supabaseAdmin");
const { evaluateQuestion } = require("../src/judge/evaluator");

async function run() {
  const admin = getAdminClient();
  
  console.log("Fetching Two Sum and 01 Matrix questions...");
  const [qRes, mRes] = await Promise.all([
    admin.from("questions").select("id, title, difficulty, function_name, input_type, output_type, testcases").eq("id", "two-sum").maybeSingle(),
    admin.from("questions").select("id, title, difficulty, function_name, input_type, output_type, testcases").eq("id", "01-matrix").maybeSingle()
  ]);

  const question = qRes.data;
  const matrixQuestion = mRes.data;

  if (!question || !matrixQuestion) {
    throw new Error("Required questions not found in database.");
  }

  const twoSumSpec = {
    submissionId: "temp-regression",
    kind: "question-evaluation",
    requestedAt: Date.now(),
    mode: "submit",
    questionId: "two-sum",
    testcases: question.testcases.map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: false,
    })),
    functionName: question.function_name,
    inputType: question.input_type,
    outputType: question.output_type,
    caseSource: "smoke",
  };

  const matrixSpec = {
    submissionId: "temp-regression",
    kind: "question-evaluation",
    requestedAt: Date.now(),
    mode: "submit",
    questionId: "01-matrix",
    testcases: matrixQuestion.testcases.map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: false,
    })),
    functionName: matrixQuestion.function_name,
    inputType: matrixQuestion.input_type,
    outputType: matrixQuestion.output_type,
    caseSource: "smoke",
  };

  console.log("\n--- TEST CASE 1: Incorrect Python Solution ---");
  const pyWrongRes = await evaluateQuestion({
    ...twoSumSpec,
    submissionId: "py-wrong",
    language: "python",
    code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        return [0, 0]"
  });
  console.log(`Result: ${pyWrongRes.result} (${pyWrongRes.summary.passed}/${pyWrongRes.summary.total} passed)`);
  assert.strictEqual(pyWrongRes.result, "Wrong Answer");

  console.log("\n--- TEST CASE 2: Incorrect Java Solution ---");
  const javaWrongRes = await evaluateQuestion({
    ...twoSumSpec,
    submissionId: "java-wrong",
    language: "java",
    code: "class Solution {\n    public int[] solve(int[] nums, int target) {\n        int[] dr = {-1, 1, 68, 0};\n        int[] dc = {0, 0, -1, 1};\n        return new int[]{0, 0};\n    }\n}"
  });
  console.log(`Result: ${javaWrongRes.result} (${javaWrongRes.summary.passed}/${javaWrongRes.summary.total} passed)`);
  assert.strictEqual(javaWrongRes.result, "Wrong Answer");

  console.log("\n--- TEST CASE 3: Incorrect C++ Solution ---");
  const cppWrongRes = await evaluateQuestion({
    ...twoSumSpec,
    submissionId: "cpp-wrong",
    language: "cpp",
    code: "class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        return {0, 0};\n    }\n};"
  });
  console.log(`Result: ${cppWrongRes.result} (${cppWrongRes.summary.passed}/${cppWrongRes.summary.total} passed)`);
  if (cppWrongRes.result === "Compile Error") {
    console.log("Compile Error details:", cppWrongRes.cases?.[0]?.output || cppWrongRes.diagnostics);
  }
  assert.strictEqual(cppWrongRes.result, "Wrong Answer");

  console.log("\n--- TEST CASE 4: Compile Error Java ---");
  const javaCompileErrRes = await evaluateQuestion({
    ...twoSumSpec,
    submissionId: "java-compile-error",
    language: "java",
    code: "class Solution { public int[] solve(int[] nums, int target) { return syntax_error; } }"
  });
  console.log(`Result: ${javaCompileErrRes.result}`);
  assert.strictEqual(javaCompileErrRes.result, "Compile Error");

  console.log("\n--- TEST CASE 5: Runtime Error Python ---");
  const pyRuntimeErrRes = await evaluateQuestion({
    ...twoSumSpec,
    submissionId: "py-runtime-error",
    language: "python",
    code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        raise Exception('Test runtime exception')"
  });
  console.log(`Result: ${pyRuntimeErrRes.result}`);
  assert.strictEqual(pyRuntimeErrRes.result, "Runtime Error");

  console.log("\n--- TEST CASE 6: Correct Python Solution ---");
  const pyCorrectRes = await evaluateQuestion({
    ...twoSumSpec,
    submissionId: "py-correct",
    language: "python",
    code: "class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []"
  });
  console.log(`Result: ${pyCorrectRes.result} (${pyCorrectRes.summary.passed}/${pyCorrectRes.summary.total} passed)`);
  assert.strictEqual(pyCorrectRes.result, "Accepted");

  console.log("\n--- TEST CASE 7: Incorrect Matrix BFS Java Solution ---");
  const matrixWrongRes = await evaluateQuestion({
    ...matrixSpec,
    submissionId: "matrix-wrong",
    language: "java",
    code: `import java.util.*;
class Solution {
    public int[][] updateMatrix(int[][] mat) {
        int m = mat.length;
        int n = mat[0].length;
        int[][] dist = new int[m][n];
        Queue<int[]> q = new LinkedList<>();
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (mat[i][j] == 0) {
                    dist[i][j] = 0;
                    q.offer(new int[]{i, j});
                } else {
                    dist[i][j] = Integer.MAX_VALUE;
                }
            }
        }
        int[] dr = {-1, 1, 68, 0}; // Incorrect left direction
        int[] dc = {0, 0, -1, 1};
        while (!q.isEmpty()) {
            int[] cell = q.poll();
            int r = cell[0];
            int c = cell[1];
            for (int i = 0; i < 4; i++) {
                int nr = r + dr[i];
                int nc = c + dc[i];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                    if (dist[nr][nc] > dist[r][c] + 1) {
                        dist[nr][nc] = dist[r][c] + 1;
                        q.offer(new int[]{nr, nc});
                    }
                }
            }
        }
        return dist;
    }
}`
  });
  console.log(`Result: ${matrixWrongRes.result} (${matrixWrongRes.summary.passed}/${matrixWrongRes.summary.total} passed)`);
  assert.strictEqual(matrixWrongRes.result, "Wrong Answer");

  console.log("\nAll regression tests passed successfully!");
}

run().catch((err) => {
  console.error("Regression test failed:", err);
  process.exit(1);
});

process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");
const fs = require("fs");
const path = require("path");
const Module = require("module");
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
process.env.JUDGE_EXECUTION_TIMEOUT_MS = "20000";

const { getAdminClient } = require("../src/lib/supabaseAdmin");
const { evaluateQuestion } = require("../src/judge/evaluator");

async function run() {
  const admin = getAdminClient();
  const { data: matrixQuestion } = await admin
    .from("questions")
    .select("id, title, difficulty, function_name, input_type, output_type, testcases")
    .eq("id", "01-matrix")
    .maybeSingle();

  const code = `import java.util.*;

class Solution {
    public int[][] updateMatrix(int[][] mat) {

        int m = mat.length;
        int n = mat[0].length;

        int[][] ans = new int[m][n];

        Queue<int[]> queue = new LinkedList<>();

        // Initialize distances
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {

                if (mat[i][j] == 0) {
                    ans[i][j] = 0;
                    queue.offer(new int[]{i, j});
                } else {
                    ans[i][j] = -1; // Unvisited
                }
            }
        }

        int[] dr = {-1, 1, 80, 0};
        int[] dc = {0, 0, -1, 1};

        while (!queue.isEmpty()) {

            int[] cell = queue.poll();
            int r = cell[0];
            int c = cell[1];

            for (int k = 0; k < 4; k++) {

                int nr = r + dr[k];
                int nc = c + dc[k];

                if (nr >= 0 && nr < m &&
                    nc >= 0 && nc < n &&
                    ans[nr][nc] == -1) {

                    ans[nr][nc] = ans[r][c] + 1;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }

        return ans;
    }
}`;

  const res = await evaluateQuestion({
    submissionId: "test-user-code",
    kind: "question-evaluation",
    requestedAt: Date.now(),
    mode: "submit",
    questionId: "01-matrix",
    testcases: matrixQuestion.testcases,
    functionName: matrixQuestion.function_name,
    inputType: matrixQuestion.input_type,
    outputType: matrixQuestion.output_type,
    caseSource: "smoke",
    language: "java",
    code
  });

  console.log("Result:", res.result);
  console.log("Passed:", res.summary.passed, "/", res.summary.total);
  
  if (res.result === "Wrong Answer") {
     const failed = res.cases.find(c => !c.passed);
     console.log("First Failed Case Input:", failed.input);
     console.log("First Failed Case Expected:", failed.expectedOutput);
     console.log("First Failed Case Actual:", failed.output);
  }
}

run().catch(console.error);

process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const path = require("path");

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

const { randomUUID } = require("crypto");
const { evaluateQuestion } = require("../src/judge/evaluator");

function buildJob({ language, code, functionName, inputType, outputType, cases }) {
  return {
    submissionId: randomUUID(),
    kind: "question-evaluation",
    requestedAt: Date.now(),
    mode: "submit",
    code,
    language,
    questionId: `smoke-${language}`,
    testcases: cases,
    functionName,
    inputType,
    outputType,
    caseSource: "smoke",
  };
}

async function runCase(spec) {
  const started = Date.now();
  const payload = await evaluateQuestion(buildJob(spec));
  return {
    language: spec.language,
    result: payload.result,
    passed: payload.summary?.passed ?? 0,
    total: payload.summary?.total ?? 0,
    elapsedMs: Date.now() - started,
    diagnostics: payload.diagnostics || [],
    warnings: payload.warnings || [],
    cases: payload.cases,
  };
}

(async () => {
  const suite = [
    {
      language: "cpp",
      code: "class Solution { public: int add(int a, int b) { return a + b; } };",
      functionName: "add",
      inputType: "int,int",
      outputType: "int",
      cases: [
        { input: "2,3", expectedOutput: "5", isHidden: false },
        { input: "10,20", expectedOutput: "30", isHidden: true },
      ],
    },
    {
      language: "java",
      code: "import java.util.*;\nclass Solution {\n    public List<Integer> solve(int[] nums) {\n        List<Integer> res = new ArrayList<>();\n        for (int x : nums) res.add(x * 2);\n        return res;\n    }\n}",
      functionName: "solve",
      inputType: "int[]",
      outputType: "List<Integer>",
      cases: [
        { input: "[1,2,3]", expectedOutput: "[2,4,6]", isHidden: false },
      ],
    },
    {
      language: "python",
      code: "class Solution:\n    def solve(self, nums: list[int]) -> list[int]:\n        return [x * 2 for x in nums]",
      functionName: "solve",
      inputType: "int[]",
      outputType: "int[]",
      cases: [
        { input: "[1,2,3]", expectedOutput: "[2,4,6]", isHidden: false },
      ],
    },
  ];

  const results = [];
  for (const spec of suite) {
    try {
      const out = await runCase(spec);
      results.push(out);
      console.log(`[judge-smoke] ${spec.language}: ${out.result} (${out.passed}/${out.total}) in ${out.elapsedMs}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ language: spec.language, result: "FAILED", error: message });
      console.error(`[judge-smoke] ${spec.language}: FAILED - ${message}`);
    }
  }

  fs.writeFileSync("tmp_judge_smoke_all.json", JSON.stringify(results, null, 2));
  const failed = results.some((r) => r.result !== "Accepted");
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fs.writeFileSync("tmp_judge_smoke_all.json", JSON.stringify({ error: message }, null, 2));
  console.error(message);
  process.exit(1);
});

process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const { buildBatchWrappedCode } = require("../src/judge/batchWrappers");

const code = "class Solution { public: int add(int a, int b) { return a + b; } };";
const wrapped = buildBatchWrappedCode(
  "cpp",
  code,
  "add",
  [{ input: "2,3", expectedOutput: "5", isHidden: false }],
  "int,int"
);

fs.writeFileSync("tmp_cpp_wrapped.cpp", wrapped);
console.log("wrote tmp_cpp_wrapped.cpp");

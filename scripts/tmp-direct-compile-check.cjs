process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const { buildBatchWrappedCode } = require("../src/judge/batchWrappers");
const { executeInSandbox } = require("../src/judge/dockerExecutor");

(async () => {
  const javaCode = "class Solution { public int add(int a, int b) { return a + b; } }";
  const cppCode = "class Solution { public: int add(int a, int b) { return a + b; } };";
  const cases = [{ input: "2,3", expectedOutput: "5", isHidden: false }];

  const wrappedJava = buildBatchWrappedCode("java", javaCode, "add", cases, "int,int");
  const wrappedCpp = buildBatchWrappedCode("cpp", cppCode, "add", cases, "int,int");

  fs.writeFileSync("tmp_java_wrapped.java", wrappedJava);
  fs.writeFileSync("tmp_cpp_wrapped.cpp", wrappedCpp);

  const javaRes = await executeInSandbox({ language: "java", code: wrappedJava, stdin: "" });
  const cppRes = await executeInSandbox({ language: "cpp", code: wrappedCpp, stdin: "" });

  const out = { java: javaRes, cpp: cppRes };
  fs.writeFileSync("tmp_direct_compile_check.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();

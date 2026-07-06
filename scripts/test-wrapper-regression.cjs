require("ts-node/register/transpile-only");

const assert = require("assert");
const {
  buildJavaInvocationPlan,
  buildWrappedCode,
} = require("../src/judge/wrappers.ts");

function testScalarIntegerInput() {
  const plan = buildJavaInvocationPlan(
    "class Solution { public int solve(int n) { return n; } }",
    "n = 3",
    undefined,
    "solve"
  );

  assert.deepStrictEqual(plan.preludeLines, ["        int n = 3;"]);
  assert.strictEqual(plan.args, "n");

  const wrapped = buildWrappedCode(
    "java",
    "class Solution { public int solve(int n) { return n; } }",
    "solve",
    "n = 3"
  );

  assert.ok(wrapped.includes("int n = 3;"), "expected scalar integer declaration");
  assert.ok(!wrapped.includes("new int[]3"), "must not emit invalid int[] scalar syntax");
}

function testArrayInput() {
  const plan = buildJavaInvocationPlan(
    "class Solution { public int solve(int[] nums) { return nums.length; } }",
    "nums = [1,2,3]",
    undefined,
    "solve"
  );

  assert.deepStrictEqual(plan.preludeLines, ["        int[] nums = new int[]{1,2,3};"]);
  assert.strictEqual(plan.args, "nums");

  const wrapped = buildWrappedCode(
    "java",
    "class Solution { public int solve(int[] nums) { return nums.length; } }",
    "solve",
    "nums = [1,2,3]"
  );

  assert.ok(wrapped.includes("int[] nums = new int[]{1,2,3};"), "expected array declaration");
}

function run() {
  testScalarIntegerInput();
  testArrayInput();
  console.log("wrapper regression passed");
}

run();

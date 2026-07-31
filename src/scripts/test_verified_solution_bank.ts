import { VerifiedSolutionBank } from "../platform/content-pipeline/data/VerifiedSolutionBank";
import { abbreviateProduct } from "../platform/content-pipeline/data/VerifiedSolutionBank_2117_helper";

console.log("===================================================================");
console.log("   NEXTHIRE AI: VERIFIED SOLUTION BANK AUDIT & TESTSUITE         ");
console.log("===================================================================");

const sol = VerifiedSolutionBank.getVerifiedSolution("2117");
if (!sol) {
  console.error("❌ Failed to find verified solution for LeetCode 2117 in VerifiedSolutionBank.");
  process.exit(1);
}

console.log(`✅ Loaded Verified Solution Bank Entry: [${sol.id}] ${sol.title} (${sol.difficulty})`);
console.log(`   Official Function: ${sol.official_function_name}()`);
console.log(`   Module: ${sol.module}`);
console.log(`   Algorithmic Guidelines Enforced:`);
sol.key_algorithmic_notes.forEach((note) => console.log(`     - ${note}`));

console.log(`\n--- Executing Ground-Truth Test Cases for 2117. Abbreviating the Product of a Range ---`);

let allPassed = true;
const testcases = [
  { left: 2, right: 11, expected: "399168e2" },
  { left: 371, right: 509, expected: "15381...22784e35" },
  { left: 1, right: 4, expected: "24e0" },
];

for (const tc of testcases) {
  const actual = abbreviateProduct(tc.left, tc.right);
  const pass = actual === tc.expected;
  console.log(
    `Test [left=${tc.left}, right=${tc.right}] -> Expected: "${tc.expected}", Actual: "${actual}" | ${
      pass ? "✅ PASS" : "❌ FAIL"
    }`
  );
  if (!pass) allPassed = false;
}

if (!allPassed) {
  console.error("\n❌ One or more verified test cases failed!");
  process.exit(1);
}

console.log("\n🎉 ALL VERIFIED TEST CASES PASSED! VerifiedSolutionBank is ground-truth compliant.");

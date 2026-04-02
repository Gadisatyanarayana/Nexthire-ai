import type { CodingQuestion } from "@/lib/codingQuestions";

type CaseResult = {
  input: string;
  output: string;
  expectedOutput: string;
  status: string;
  passed: boolean;
};

export type SubmissionSkillReport = {
  approachQuality: number;
  optimizationQuality: number;
  edgeCaseQuality: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  nextPractice: string[];
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildSubmissionSkillReport(
  question: CodingQuestion,
  code: string,
  language: "cpp" | "java" | "python",
  cases: CaseResult[]
): SubmissionSkillReport {
  const codeText = String(code || "");
  const lines = codeText.split(/\r?\n/).length;
  const passRate = cases.length > 0 ? cases.filter((c) => c.passed).length / cases.length : 0;
  const hasComments = /\/\/|#|\/\*/.test(codeText);
  const hasHelper = /\b(helper|util|dfs|bfs|binarySearch|twoPointer|slidingWindow|backtrack|memo|dp)\b/i.test(codeText);
  const hasGuard = /\bif\b|\breturn\b/.test(codeText);
  const hasEfficientPattern = /\b(map|set|unordered_map|unordered_set|heapq|priority_queue|deque|binary_search|sort\(|Collections\.sort|Arrays\.sort|bisect)\b/i.test(codeText);
  const edgeAware = /(len\(|\.length|n\s*[<=>]=?|==\s*0|null|None|empty\(|isEmpty\()/i.test(codeText);
  const topicSignal = (question.topic || []).join(" ").toLowerCase();

  let approachQuality = 40 + passRate * 35;
  if (hasHelper) approachQuality += 10;
  if (hasComments) approachQuality += 5;
  if (hasGuard) approachQuality += 8;
  if (lines > 200) approachQuality -= 6;

  let optimizationQuality = 35 + passRate * 35;
  if (hasEfficientPattern) optimizationQuality += 20;
  if (topicSignal.includes("dynamic programming") && /\bdp\b|memo/i.test(codeText)) optimizationQuality += 7;
  if (topicSignal.includes("graph") && /\bqueue\b|\bstack\b|visited/i.test(codeText)) optimizationQuality += 7;

  let edgeCaseQuality = 30 + passRate * 40;
  if (edgeAware) edgeCaseQuality += 18;
  if (cases.length >= 3) edgeCaseQuality += 8;
  if (cases.some((c) => !c.passed)) edgeCaseQuality -= 6;

  approachQuality = clampScore(approachQuality);
  optimizationQuality = clampScore(optimizationQuality);
  edgeCaseQuality = clampScore(edgeCaseQuality);
  const overallScore = clampScore((approachQuality + optimizationQuality + edgeCaseQuality) / 3);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const nextPractice: string[] = [];

  if (approachQuality >= 75) strengths.push("Solution structure is interview-friendly and readable.");
  else improvements.push("Explain your approach in 3-4 steps before coding and keep helper logic modular.");

  if (optimizationQuality >= 75) strengths.push("Uses data structures/patterns aligned with optimized interview solutions.");
  else improvements.push("Re-evaluate complexity and replace brute-force loops with section-specific optimized patterns.");

  if (edgeCaseQuality >= 75) strengths.push("Edge conditions are handled with stable control flow.");
  else improvements.push("Add explicit checks for empty input, boundary indices, duplicates, and single-element cases.");

  nextPractice.push(`Practice 2 more ${question.difficulty} problems in ${question.section || "core-dsa"} this week.`);
  nextPractice.push("After each solve, write one optimization note and one edge-case note in your revision sheet.");
  nextPractice.push(`Re-submit this ${language.toUpperCase()} solution after adding at least 2 custom failing tests.`);

  return {
    approachQuality,
    optimizationQuality,
    edgeCaseQuality,
    overallScore,
    strengths,
    improvements,
    nextPractice,
  };
}

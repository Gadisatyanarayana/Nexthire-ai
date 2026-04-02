import type { CodingQuestion } from "@/lib/codingQuestions";
import { sectionLabel } from "@/lib/dsaSections";

export type LearningBlueprint = {
  section: string;
  concepts: string[];
  prerequisites: string[];
  solvePlan: string[];
  interviewSignals: string[];
  commonMistakes: string[];
  portfolioPrompt: string;
};

const SECTION_PREREQS: Record<string, string[]> = {
  "arrays-hashing": ["Big-O basics", "Frequency maps", "Index-based reasoning"],
  "two-pointers-sliding-window": ["Array traversal", "Invariant tracking", "Window boundaries"],
  "stack-queue": ["LIFO/FIFO behavior", "Amortized operations", "Monotonic data structure idea"],
  linkedlist: ["Pointer updates", "Edge-case simulation", "In-place manipulation"],
  trees: ["Recursion fundamentals", "DFS/BFS traversal", "Tree node relationships"],
  graphs: ["Traversal patterns", "Visited-state modeling", "Adjacency representation"],
  "binary-search": ["Sorted search space", "Boundary conditions", "Feasibility checks"],
  recursion: ["Base/recursive cases", "Call-stack tracing", "Subproblem decomposition"],
  backtracking: ["State space tree", "Choice + undo", "Pruning conditions"],
  "dynamic-programming": ["State definition", "Transition design", "Memoization/tabulation"],
  greedy: ["Local optimal choices", "Proof intuition", "Counterexample testing"],
  bitmanipulation: ["Binary operations", "Masking", "Bitwise patterns"],
  math: ["Mod arithmetic", "Number properties", "Constraint-based simplification"],
  strings: ["Character processing", "Substring logic", "Hashing/suffix intuition"],
  "heaps-priority-queue": ["Heap invariants", "Top-K thinking", "Streaming updates"],
  trie: ["Prefix trees", "Node branching", "String search optimization"],
  "segment-tree-fenwick": ["Range query decomposition", "Point/range updates", "Prefix accumulation"],
  "system-design-lite": ["Scalability basics", "Trade-off analysis", "API boundary thinking"],
  "core-dsa": ["Time-space analysis", "Data structure selection", "Input constraints"],
};

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

export function buildLearningBlueprint(question: CodingQuestion): LearningBlueprint {
  const section = String(question.section || "core-dsa").toLowerCase();
  const concepts = uniq([sectionLabel(section), ...(question.topic || []).slice(0, 5)]);
  const prerequisites = SECTION_PREREQS[section] || SECTION_PREREQS["core-dsa"];

  const solvePlan = [
    "Read constraints and classify input size before choosing an approach.",
    `Model the problem as ${sectionLabel(section)} and sketch one brute-force baseline first.`,
    "Optimize to target complexity and write down loop/recursion invariants.",
    "Dry run the provided example and one custom edge case before coding.",
    "Submit, then review complexity and one alternative approach used in interviews.",
  ];

  const interviewSignals = [
    "Explains trade-offs between brute-force and optimal solution clearly.",
    "Uses meaningful variable names and handles edge cases early.",
    "Communicates complexity using input constraints, not guesswork.",
  ];

  const commonMistakes = [
    "Skipping edge-case validation (empty input, duplicates, boundaries).",
    "Choosing the right data structure too late after coding starts.",
    "Not verifying expected output against at least one manual trace.",
  ];

  return {
    section: sectionLabel(section),
    concepts,
    prerequisites,
    solvePlan,
    interviewSignals,
    commonMistakes,
    portfolioPrompt: `Write a short note after solving: why ${sectionLabel(section)} was the correct pattern and what complexity improvement you achieved.`,
  };
}
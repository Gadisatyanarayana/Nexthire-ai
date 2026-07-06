/**
 * complexityEstimator.ts
 *
 * Production-grade static complexity estimator for Java, Python, and C++.
 * Uses heuristic AST-like analysis (regex + token scanning) to estimate:
 *   - Time Complexity (loop nesting depth, recursion patterns)
 *   - Space Complexity (auxiliary data structures, recursion stack)
 * And emits warnings for dangerous recursion patterns.
 */

import type { SupportedLanguage } from "./types";

// ─── Public Types ──────────────────────────────────────────────────────────

export type ComplexityClass =
  | "O(1)"
  | "O(log N)"
  | "O(N)"
  | "O(N log N)"
  | "O(N²)"
  | "O(N³)"
  | "O(2^N)"
  | "O(N!)"
  | "Unknown";

export type ComplexityWarning = {
  severity: "info" | "warning" | "danger";
  message: string;
};

export type ComplexityResult = {
  timeComplexity: ComplexityClass;
  spaceComplexity: ComplexityClass;
  warnings: ComplexityWarning[];
  isRecursive: boolean;
  maxLoopDepth: number;
  details: string;
};

// ─── Internal Analysis Types ───────────────────────────────────────────────

type LoopPattern = {
  regex: RegExp;
  label: string;
};

type DataStructurePattern = {
  regex: RegExp;
  spaceClass: ComplexityClass;
  label: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────

/** Minimum code length to run analysis on. Shorter code skips analysis. */
const MIN_CODE_LENGTH = 30;

/** Maximum number of warnings to emit. */
const MAX_WARNINGS = 6;

// ─── Language-specific loop detectors ─────────────────────────────────────

const JAVA_LOOP_PATTERNS: LoopPattern[] = [
  { regex: /\bfor\s*\(/g, label: "for" },
  { regex: /\bwhile\s*\(/g, label: "while" },
  { regex: /\bdo\s*\{/g, label: "do-while" },
  { regex: /\.stream\(\)/g, label: "stream" },
  { regex: /\.forEach\s*\(/g, label: "forEach" },
  { regex: /\.map\s*\(/g, label: ".map" },
  { regex: /\.filter\s*\(/g, label: ".filter" },
  { regex: /\.reduce\s*\(/g, label: ".reduce" },
];

const CPP_LOOP_PATTERNS: LoopPattern[] = [
  { regex: /\bfor\s*\(/g, label: "for" },
  { regex: /\bwhile\s*\(/g, label: "while" },
  { regex: /\bdo\s*\{/g, label: "do-while" },
  { regex: /std::for_each\s*\(/g, label: "std::for_each" },
  { regex: /\btransform\s*\(/g, label: "transform" },
  { regex: /\baccumulate\s*\(/g, label: "accumulate" },
];

const PYTHON_LOOP_PATTERNS: LoopPattern[] = [
  { regex: /\bfor\s+\w/g, label: "for" },
  { regex: /\bwhile\s+/g, label: "while" },
  { regex: /\bmap\s*\(/g, label: "map()" },
  { regex: /\bfilter\s*\(/g, label: "filter()" },
  { regex: /\breduce\s*\(/g, label: "reduce()" },
  { regex: /\b\w+\s*for\s+\w+\s+in\s+/g, label: "list comprehension" },
];

// ─── Language-specific data structure detectors ───────────────────────────

const JAVA_DS_PATTERNS: DataStructurePattern[] = [
  { regex: /\bnew\s+(?:int|long|double|boolean|char|String|Object)\s*\[/, spaceClass: "O(N)", label: "array" },
  { regex: /new\s+ArrayList\s*[<(]/, spaceClass: "O(N)", label: "ArrayList" },
  { regex: /new\s+LinkedList\s*[<(]/, spaceClass: "O(N)", label: "LinkedList" },
  { regex: /new\s+HashMap\s*[<(]/, spaceClass: "O(N)", label: "HashMap" },
  { regex: /new\s+HashSet\s*[<(]/, spaceClass: "O(N)", label: "HashSet" },
  { regex: /new\s+TreeMap\s*[<(]/, spaceClass: "O(N)", label: "TreeMap" },
  { regex: /new\s+TreeSet\s*[<(]/, spaceClass: "O(N)", label: "TreeSet" },
  { regex: /new\s+ArrayDeque\s*[<(]/, spaceClass: "O(N)", label: "ArrayDeque" },
  { regex: /new\s+PriorityQueue\s*[<(]/, spaceClass: "O(N)", label: "PriorityQueue" },
  { regex: /new\s+Stack\s*[<(]/, spaceClass: "O(N)", label: "Stack" },
  { regex: /new\s+int\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/, spaceClass: "O(N²)", label: "2D array" },
];

const CPP_DS_PATTERNS: DataStructurePattern[] = [
  { regex: /\bvector\s*</, spaceClass: "O(N)", label: "vector" },
  { regex: /\bunordered_map\s*</, spaceClass: "O(N)", label: "unordered_map" },
  { regex: /\bunordered_set\s*</, spaceClass: "O(N)", label: "unordered_set" },
  { regex: /\bmap\s*</, spaceClass: "O(N)", label: "map" },
  { regex: /\bset\s*</, spaceClass: "O(N)", label: "set" },
  { regex: /\bdeque\s*</, spaceClass: "O(N)", label: "deque" },
  { regex: /\bqueue\s*</, spaceClass: "O(N)", label: "queue" },
  { regex: /\bstack\s*</, spaceClass: "O(N)", label: "stack" },
  { regex: /\bpriority_queue\s*</, spaceClass: "O(N)", label: "priority_queue" },
  { regex: /\bvector\s*<\s*vector\s*</, spaceClass: "O(N²)", label: "vector<vector>" },
  { regex: /int\s+\w+\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/, spaceClass: "O(N²)", label: "2D array" },
];

const PYTHON_DS_PATTERNS: DataStructurePattern[] = [
  { regex: /\bdict\s*\(|\{\s*['"]\w/, spaceClass: "O(N)", label: "dict" },
  { regex: /\bset\s*\(|\bset\s*\{/, spaceClass: "O(N)", label: "set" },
  { regex: /\blist\s*\(|\[\s*[^\]]*for\s+/, spaceClass: "O(N)", label: "list" },
  { regex: /\bdeque\s*\(/, spaceClass: "O(N)", label: "deque" },
  { regex: /\bcollections\.defaultdict/, spaceClass: "O(N)", label: "defaultdict" },
  { regex: /\bcollections\.Counter/, spaceClass: "O(N)", label: "Counter" },
  { regex: /\bcollections\.OrderedDict/, spaceClass: "O(N)", label: "OrderedDict" },
  { regex: /heapq/, spaceClass: "O(N)", label: "heap" },
  { regex: /\[\s*\[.*\]\s*for\s+/, spaceClass: "O(N²)", label: "2D list comprehension" },
  { regex: /\[\s*\[None\]\s*\*\s*\w+\s*\]\s*\*\s*\w+/, spaceClass: "O(N²)", label: "2D list" },
];

// ─── Recursion pattern detectors ───────────────────────────────────────────

/** Detect if the user function is recursive (calls itself). */
function detectRecursion(language: SupportedLanguage, code: string, functionName: string): boolean {
  if (!functionName || functionName === "solve") return _genericRecursionDetect(code);

  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const selfCallPattern = new RegExp(`\\b${escaped}\\s*\\(`, "g");

  // Count all occurrences: 1 is the definition, 2+ means self-call
  const matches = code.match(selfCallPattern) || [];
  if (matches.length >= 2) return true;

  return _genericRecursionDetect(code);
}

function _genericRecursionDetect(code: string): boolean {
  // Common recursive patterns
  const patterns = [
    /\breturn\s+\w+\s*\(.*\)/,          // return funcname(...)
    /\bhelper\s*\(/,                     // helper function called inside
    /\bdfs\s*\(/,                        // DFS recursion
    /\bbfs\s*\(/,                        // BFS (usually iterative but detect)
    /\brecur\s*\(/,                      // common recursive helper name
    /\bsolve\s*\(/,                      // generic recursive solve
    /\bmemo\s*\[/,                       // memoization array access
    /\bdp\s*\[/,                         // DP table - may indicate recursion+memo
  ];
  return patterns.some((p) => p.test(code));
}

// ─── Loop Nesting Depth Analysis ──────────────────────────────────────────

/**
 * Estimate max loop nesting depth by scanning the body of the Solution method.
 * We walk the code character-by-character to track brace depth when entering
 * known loop keywords, giving us an accurate nesting count.
 */
function computeMaxLoopNestingDepth(language: SupportedLanguage, code: string): number {
  // Strip comments for cleaner analysis
  const stripped = stripComments(language, code);

  let maxDepth = 0;
  let currentDepth = 0;
  let braceDepth = 0;
  const loopBraceDepths: number[] = [];

  const patterns = language === "java"
    ? JAVA_LOOP_PATTERNS
    : language === "cpp"
    ? CPP_LOOP_PATTERNS
    : PYTHON_LOOP_PATTERNS;

  // For Python we count indentation-based nesting instead of braces
  if (language === "python") {
    return computePythonLoopDepth(stripped);
  }

  // For Java/C++ we scan for loop keywords at each position
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === "{") {
      braceDepth++;
    } else if (ch === "}") {
      braceDepth--;
      // Remove any loop markers at this depth
      const lastLoopDepth = loopBraceDepths[loopBraceDepths.length - 1];
      if (lastLoopDepth !== undefined && lastLoopDepth > braceDepth) {
        loopBraceDepths.pop();
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    // Check if we're at a loop keyword
    for (const pattern of patterns) {
      const remainder = stripped.slice(i);
      const keyword = pattern.label;
      const kw = keyword.split("(")[0].trim();
      if (remainder.startsWith(kw) && /\W/.test(remainder[kw.length] || " ")) {
        // Found a loop — mark its depth
        loopBraceDepths.push(braceDepth);
        currentDepth = loopBraceDepths.length;
        if (currentDepth > maxDepth) maxDepth = currentDepth;
        break;
      }
    }
  }

  return maxDepth;
}

function computePythonLoopDepth(code: string): number {
  const lines = code.split("\n");
  let maxLoopDepth = 0;
  const loopIndents: number[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;

    // Get indentation level (4 spaces or 1 tab = 1 level)
    const indent = line.length - line.trimStart().length;
    const indentLevel = Math.floor(indent / 4) || Math.floor(indent / 2) || indent;

    // Remove loop indents that are deeper than current
    while (loopIndents.length > 0 && loopIndents[loopIndents.length - 1] >= indentLevel) {
      loopIndents.pop();
    }

    // Detect for/while
    const stripped = trimmed.trimStart();
    if (/^(for\s+\w|while\s+)/.test(stripped)) {
      loopIndents.push(indentLevel);
      if (loopIndents.length > maxLoopDepth) maxLoopDepth = loopIndents.length;
    }

    // Count list comprehensions as one loop level
    const compMatches = stripped.match(/\bfor\s+\w+\s+in\s+/g);
    if (compMatches && compMatches.length > 0) {
      const depth = loopIndents.length + compMatches.length;
      if (depth > maxLoopDepth) maxLoopDepth = depth;
    }
  }

  return maxLoopDepth;
}

// ─── Space Complexity Analysis ────────────────────────────────────────────

function detectSpaceComplexity(language: SupportedLanguage, code: string, isRecursive: boolean): ComplexityClass {
  const patterns = language === "java"
    ? JAVA_DS_PATTERNS
    : language === "cpp"
    ? CPP_DS_PATTERNS
    : PYTHON_DS_PATTERNS;

  let maxSpace: ComplexityClass = "O(1)";

  for (const ds of patterns) {
    if (ds.regex.test(code)) {
      if (ds.spaceClass === "O(N²)") {
        maxSpace = "O(N²)";
        break; // Max we detect
      }
      if (maxSpace === "O(1)") {
        maxSpace = ds.spaceClass;
      }
    }
  }

  // Recursion contributes O(N) stack space
  if (isRecursive && maxSpace === "O(1)") {
    maxSpace = "O(N)";
  }

  return maxSpace;
}

// ─── Binary Search / Divide & Conquer Patterns ────────────────────────────

function detectLogNPattern(code: string): boolean {
  const logPatterns = [
    /\bmid\s*=\s*(?:\w+\s*[+*\/]\s*\w+\s*[/]\s*2|\(\s*\w+\s*\+\s*\w+\s*\)\s*\/\s*2|left\s*\+\s*\(\s*right\s*-\s*left\s*\)\s*\/\s*2)/,
    /\bbinarySearch\b/,
    /\bbinary_search\b/,
    /\bBinarySearch\b/,
    /\blow\s*=\s*mid\s*[+\-]\s*1|\bhigh\s*=\s*mid\s*[+\-]\s*1/,
    /\bleft\s*=\s*mid\s*[+\-]\s*1|\bright\s*=\s*mid\s*[+\-]\s*1/,
    /\blg\s*n\b/i,
    /\bMath\.log\b|\bstd::log\b|\bmath\.log\b/,
  ];
  return logPatterns.some((p) => p.test(code));
}

function detectNLogNPattern(code: string): boolean {
  const nlogPatterns = [
    /\b(?:Arrays|Collections)\.sort\b/,
    /\bstd::sort\b/,
    /\bsorted\s*\(/,
    /\.sort\s*\(/,
    /\bheapify\b|\bheappush\b|\bheappop\b/,
    /\bMergeSort\b|\bmerge_sort\b|\bmergeSort\b/,
    /\bTreeMap\b|\bTreeSet\b|\bstd::map\b|\bstd::set\b/,
  ];
  return nlogPatterns.some((p) => p.test(code));
}

function detectExponentialPattern(code: string): boolean {
  const expPatterns = [
    // Fibonacci-like double recursion
    /return\s+\w+\s*\(\s*\w+\s*-\s*1\s*\)\s*\+\s*\w+\s*\(\s*\w+\s*-\s*2\s*\)/,
    // Backtracking / combinatorial patterns
    /\bbacktrack\b|\bpermutation\b|\bcombination\b|\bsubset\b/i,
    // Power set / brute force
    /\bpowerSet\b|\bpower_set\b/i,
    // n-queens / sudoku
    /\bn-queens\b|\bsudoku\b/i,
  ];
  return expPatterns.some((p) => p.test(code));
}

// ─── Time Complexity Classification ──────────────────────────────────────

function classifyTimeComplexity(
  maxLoopDepth: number,
  isRecursive: boolean,
  code: string
): ComplexityClass {
  // Exponential: double recursion or backtracking
  if (isRecursive && detectExponentialPattern(code)) {
    return "O(2^N)";
  }

  // N log N: sort + loop or sort
  if (maxLoopDepth >= 1 && detectNLogNPattern(code)) {
    return "O(N log N)";
  }

  // Pure sort without extra loops
  if (maxLoopDepth === 0 && detectNLogNPattern(code)) {
    return "O(N log N)";
  }

  // Cubic: 3 nested loops
  if (maxLoopDepth >= 3) return "O(N³)";

  // Quadratic: 2 nested loops
  if (maxLoopDepth >= 2) return "O(N²)";

  // N log N: binary search inside a loop
  if (maxLoopDepth >= 1 && detectLogNPattern(code)) {
    return "O(N log N)";
  }

  // Linear: single loop
  if (maxLoopDepth >= 1) return "O(N)";

  // Recursive without exponential markers
  if (isRecursive) {
    if (detectLogNPattern(code)) return "O(log N)";
    return "O(N)"; // assume linear recursion
  }

  // Binary search without any outer loop
  if (detectLogNPattern(code)) return "O(log N)";

  return "O(1)";
}

// ─── Warning Generation ───────────────────────────────────────────────────

function buildWarnings(
  timeClass: ComplexityClass,
  spaceClass: ComplexityClass,
  isRecursive: boolean,
  maxLoopDepth: number,
  code: string,
  language: SupportedLanguage
): ComplexityWarning[] {
  const warnings: ComplexityWarning[] = [];

  if (timeClass === "O(N³)") {
    warnings.push({
      severity: "danger",
      message: "⚠️ O(N³) detected — triple nested loops may TLE for N > 500.",
    });
  } else if (timeClass === "O(N²)") {
    warnings.push({
      severity: "warning",
      message: "⚡ O(N²) detected — may TLE for large inputs (N > 10,000). Consider a hash map or two-pointer approach.",
    });
  } else if (timeClass === "O(2^N)") {
    warnings.push({
      severity: "danger",
      message: "🔴 O(2^N) exponential complexity — will TLE for N > 25. Add memoization or use dynamic programming.",
    });
  } else if (timeClass === "O(N!)" ) {
    warnings.push({
      severity: "danger",
      message: "🔴 O(N!) factorial complexity — extremely expensive. Only feasible for N ≤ 10.",
    });
  }

  // Recursion depth warning
  if (isRecursive) {
    const hasBaseCaseHint =
      /\breturn\s+\d+|return\s+(null|None|false|true|0|1|"\"|{})/.test(code);
    if (!hasBaseCaseHint) {
      warnings.push({
        severity: "warning",
        message: "🔁 Recursive function detected. Ensure a proper base case to prevent stack overflow.",
      });
    }

    // Deep recursion
    if (timeClass === "O(N)" || timeClass === "O(N²)") {
      warnings.push({
        severity: "info",
        message:
          "💡 For inputs with N > 10,000 recursive calls, consider converting to an iterative approach to avoid stack overflow.",
      });
    }

    // No memo / DP
    const hasMemo =
      /\bmemo\b|\bdp\b|\bcache\b|\blru_cache\b|\b@cache\b|\bfunctools\b/.test(code);
    if (timeClass === "O(2^N)" && !hasMemo) {
      warnings.push({
        severity: "danger",
        message: "💀 Double recursion without memoization — guaranteed TLE on any real input. Use @lru_cache or a memo dict/array.",
      });
    }
  }

  // Large loop depth
  if (maxLoopDepth >= 3) {
    warnings.push({
      severity: "danger",
      message: `⚠️ ${maxLoopDepth}-level nested loops detected — verify this is intentional (O(N³) or worse).`,
    });
  }

  // Space warning
  if (spaceClass === "O(N²)") {
    warnings.push({
      severity: "warning",
      message: "📦 O(N²) space detected — ensure the input size won't exhaust available memory.",
    });
  }

  return warnings.slice(0, MAX_WARNINGS);
}

// ─── Comment Stripping ────────────────────────────────────────────────────

function stripComments(language: SupportedLanguage, code: string): string {
  if (language === "python") {
    // Remove # comments and docstrings
    return code
      .replace(/"""[\s\S]*?"""/g, "")
      .replace(/'''[\s\S]*?'''/g, "")
      .replace(/#.*/g, "");
  }
  // Java / C++
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")  // block comments
    .replace(/\/\/.*/g, "");            // line comments
}

// ─── Extract Function Name ────────────────────────────────────────────────

function extractFunctionName(language: SupportedLanguage, code: string): string {
  if (language === "java") {
    const m = code.match(/class\s+Solution[\s\S]*?\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+([A-Za-z_]\w*)\s*\(/m);
    return m?.[1] || "";
  }
  if (language === "cpp") {
    const m = code.match(/class\s+Solution[\s\S]*?\b[A-Za-z_][\w:<>,\s*&]*\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/m);
    return m?.[1] || "";
  }
  // Python
  const m = code.match(/class\s+Solution[\s\S]*?def\s+([A-Za-z_]\w*)\s*\(/m);
  return m?.[1] || "";
}

// ─── Build Details String ─────────────────────────────────────────────────

function buildDetails(
  timeClass: ComplexityClass,
  spaceClass: ComplexityClass,
  maxLoopDepth: number,
  isRecursive: boolean
): string {
  const parts: string[] = [];
  if (maxLoopDepth > 0) {
    parts.push(`${maxLoopDepth}-level loop nesting`);
  }
  if (isRecursive) {
    parts.push("recursive calls");
  }
  if (parts.length === 0) {
    parts.push("no loops or recursion detected");
  }
  return `Estimated from ${parts.join(" + ")}. Time: ${timeClass}, Space: ${spaceClass}.`;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Estimate the time and space complexity of user-submitted code.
 *
 * @param language  The language of the submission.
 * @param code      The raw user code (including Solution class).
 * @returns         ComplexityResult with time/space estimates and warnings.
 */
export function estimateComplexity(
  language: SupportedLanguage,
  code: string
): ComplexityResult {
  const cleanCode = String(code || "").trim();

  // Skip very short snippets
  if (cleanCode.length < MIN_CODE_LENGTH) {
    return {
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
      warnings: [],
      isRecursive: false,
      maxLoopDepth: 0,
      details: "Code too short for static analysis.",
    };
  }

  const stripped = stripComments(language, cleanCode);
  const functionName = extractFunctionName(language, stripped);

  // Detect recursion
  const isRecursive = detectRecursion(language, stripped, functionName);

  // Compute loop depth
  const maxLoopDepth = computeMaxLoopNestingDepth(language, stripped);

  // Classify time complexity
  const timeComplexity = classifyTimeComplexity(maxLoopDepth, isRecursive, stripped);

  // Detect space complexity
  const spaceComplexity = detectSpaceComplexity(language, stripped, isRecursive);

  // Generate warnings
  const warnings = buildWarnings(
    timeComplexity,
    spaceComplexity,
    isRecursive,
    maxLoopDepth,
    stripped,
    language
  );

  return {
    timeComplexity,
    spaceComplexity,
    warnings,
    isRecursive,
    maxLoopDepth,
    details: buildDetails(timeComplexity, spaceComplexity, maxLoopDepth, isRecursive),
  };
}

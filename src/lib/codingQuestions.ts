export type Difficulty = "Easy" | "Medium" | "Hard";

export type QuestionTestCase = {
  input: string;
  expectedOutput: string;
};

export type CodingQuestion = {
  id: string;
  title: string;
  difficulty: Difficulty;
  section?: string;
  function_name?: string;
  input_type?: string;
  output_type?: string;
  topic: string[];
  company_tags?: string[];
  pattern_tags?: string[];
  constraints?: string[];
  followUp?: string;
  acceptance_rate: number;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testcases: QuestionTestCase[];
  starter_code?: Partial<Record<"cpp" | "java" | "python", string>>;
  hints?: string[];
};

export const LANGUAGE_TO_RUNTIME_ID: Record<string, number> = {
  javascript: 1,
  python: 2,
  cpp: 3,
  java: 4,
};

export const STARTER_CODE: Record<string, string> = {
  cpp: `auto solve() {\n    // Write your logic here.\n}`,
  java: `Object solve() {\n    // Write your logic here.\n    return null;\n}`,
  python: `def solve():\n    # Write your logic here\n    return None\n`,
};

type DetectedVariable = {
  name: string;
  rawValue: string;
};

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let buffer = "";
  let bracketDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const prev = i > 0 ? input[i - 1] : "";

    if (ch === "'" && !inDoubleQuote && prev !== "\\") {
      inSingleQuote = !inSingleQuote;
      buffer += ch;
      continue;
    }

    if (ch === '"' && !inSingleQuote && prev !== "\\") {
      inDoubleQuote = !inDoubleQuote;
      buffer += ch;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === "[") bracketDepth++;
      if (ch === "]") bracketDepth = Math.max(0, bracketDepth - 1);

      if (ch === "," && bracketDepth === 0) {
        const trimmed = buffer.trim();
        if (trimmed) parts.push(trimmed);
        buffer = "";
        continue;
      }
    }

    buffer += ch;
  }

  const trimmed = buffer.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

function detectVariablesFromExample(exampleInput: string | undefined): DetectedVariable[] {
  if (!exampleInput) return [];

  const compact = exampleInput.replace(/\n/g, ", ");
  const parts = splitTopLevel(compact);
  const vars: DetectedVariable[] = [];

  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const left = part.slice(0, eq).trim();
    const right = part.slice(eq + 1).trim();
    if (!left || !right) continue;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(left)) continue;
    vars.push({ name: left, rawValue: right });
  }

  return vars;
}

function toCamelCase(value: string): string {
  const parts = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "solve";
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function toSnakeCase(value: string): string {
  const name = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return name || "solve";
}

function parseTypeList(inputType: string | undefined): string[] {
  const raw = String(inputType || "").trim();
  const normalized = raw.toLowerCase();
  if (!raw || normalized === "auto" || normalized === "structured" || normalized === "any" || normalized === "object") return [];
  return splitTopLevel(raw).map((t) => t.trim()).filter(Boolean);
}

function isLooseType(type: string | undefined): boolean {
  const t = normalizeTypeName(type || "");
  return !t || t === "auto" || t === "structured" || t === "any" || t === "object";
}

function inferScalarType(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "string";
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return "string";
  if (/^(true|false)$/i.test(value)) return "bool";
  if (/^-?\d+$/.test(value)) return "int";
  if (/^-?\d+\.\d+$/.test(value)) return "double";
  return "string";
}

function inferTypeFromRaw(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "string";

  if (/^\[\[.*\]\]$/.test(value)) {
    const compact = value.replace(/\s+/g, "");
    if (/\"|\'/.test(compact)) return "string[][]";
    if (/\btrue\b|\bfalse\b/i.test(compact)) return "bool[][]";
    if (/\d+\.\d+/.test(compact)) return "double[][]";
    return "int[][]";
  }

  if (/^\[.*\]$/.test(value)) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return "int[]";
    const items = splitTopLevel(inner);
    const inferred = items.map(inferScalarType);
    if (inferred.every((t) => t === "int")) return "int[]";
    if (inferred.every((t) => t === "double" || t === "int")) return "double[]";
    if (inferred.every((t) => t === "bool")) return "bool[]";
    return "string[]";
  }

  return inferScalarType(value);
}

function areTypesCompatible(declaredType: string | undefined, inferredType: string | undefined): boolean {
  const declared = normalizeTypeName(declaredType || "");
  const inferred = normalizeTypeName(inferredType || "");
  if (!declared || !inferred) return true;
  if (declared === inferred) return true;
  if (declared.includes("auto") || declared.includes("structured") || declared.includes("any") || declared.includes("object")) return true;

  const isDeclaredArray = declared.includes("[]");
  const isInferredArray = inferred.includes("[]");
  if (isDeclaredArray !== isInferredArray) return false;

  if ((declared.includes("int") || declared.includes("long") || declared.includes("double") || declared.includes("float")) &&
      (inferred.includes("int") || inferred.includes("long") || inferred.includes("double") || inferred.includes("float"))) {
    return true;
  }

  if ((declared.includes("str") || declared.includes("string")) && (inferred.includes("str") || inferred.includes("string"))) {
    return true;
  }

  if (declared.includes("bool") && inferred.includes("bool")) {
    return true;
  }

  return false;
}

function inferInputType(inputType: string | undefined, vars: DetectedVariable[]): string | undefined {
  const declared = parseTypeList(inputType);
  if (declared.length === 0) {
    if (vars.length === 0) return inputType;
    return vars.map((v) => inferTypeFromRaw(v.rawValue)).join(", ");
  }

  const allLoose = declared.every((t) => isLooseType(t));
  if (allLoose && vars.length > 0) {
    return vars.map((v) => inferTypeFromRaw(v.rawValue)).join(", ");
  }

  const resolved = declared.map((t, idx) => {
    if (!vars[idx]) return t;
    const inferred = inferTypeFromRaw(vars[idx].rawValue);
    if (isLooseType(t)) return inferred;
    if (!areTypesCompatible(t, inferred)) return inferred;
    return t;
  });
  return resolved.join(", ");
}

function inferOutputType(outputType: string | undefined, firstExampleOutput: string | undefined): string | undefined {
  if (!firstExampleOutput) return outputType;
  const inferred = inferTypeFromRaw(firstExampleOutput);
  if (isLooseType(outputType)) return inferred;
  if (!areTypesCompatible(outputType, inferred)) return inferred;
  return outputType;
}

function normalizeTypeName(type: string): string {
  return String(type || "").toLowerCase().replace(/\s+/g, "");
}

function mapToJavaType(type: string): string {
  const t = normalizeTypeName(type);
  if (!t || t === "auto") return "Object";
  if (t.includes("string[][]") || t.includes("str[][]")) return "String[][]";
  if (t.includes("double[][]") || t.includes("float[][]")) return "double[][]";
  if (t.includes("bool[][]")) return "boolean[][]";
  if (t.includes("[][]")) return "int[][]";
  if (t.includes("string[]") || t.includes("str[]")) return "String[]";
  if (t.includes("double[]") || t.includes("float[]")) return "double[]";
  if (t.includes("bool[]")) return "boolean[]";
  if (t.includes("[]")) return "int[]";
  if (t.includes("string") || t.includes("str")) return "String";
  if (t.includes("bool")) return "boolean";
  if (t.includes("double") || t.includes("float")) return "double";
  if (t.includes("long")) return "long";
  if (t.includes("int")) return "int";
  return "Object";
}

function mapToCppType(type: string): string {
  const t = normalizeTypeName(type);
  if (!t || t === "auto") return "auto";
  if (t.includes("string[][]") || t.includes("str[][]")) return "vector<vector<string>>";
  if (t.includes("double[][]") || t.includes("float[][]")) return "vector<vector<double>>";
  if (t.includes("bool[][]")) return "vector<vector<bool>>";
  if (t.includes("[][]")) return "vector<vector<int>>";
  if (t.includes("string[]") || t.includes("str[]")) return "vector<string>";
  if (t.includes("double[]") || t.includes("float[]")) return "vector<double>";
  if (t.includes("bool[]")) return "vector<bool>";
  if (t.includes("[]")) return "vector<int>";
  if (t.includes("string") || t.includes("str")) return "string";
  if (t.includes("bool")) return "bool";
  if (t.includes("double") || t.includes("float")) return "double";
  if (t.includes("long")) return "long long";
  if (t.includes("int")) return "int";
  return "auto";
}

function mapToPythonType(type: string): string {
  const t = normalizeTypeName(type);
  if (!t || t === "auto") return "Any";
  if (t.includes("string[][]") || t.includes("str[][]")) return "list[list[str]]";
  if (t.includes("double[][]") || t.includes("float[][]")) return "list[list[float]]";
  if (t.includes("bool[][]")) return "list[list[bool]]";
  if (t.includes("[][]")) return "list[list[int]]";
  if (t.includes("string[]") || t.includes("str[]")) return "list[str]";
  if (t.includes("double[]") || t.includes("float[]")) return "list[float]";
  if (t.includes("bool[]")) return "list[bool]";
  if (t.includes("[]")) return "list[int]";
  if (t.includes("string") || t.includes("str")) return "str";
  if (t.includes("bool")) return "bool";
  if (t.includes("double") || t.includes("float")) return "float";
  if (t.includes("long") || t.includes("int")) return "int";
  return "Any";
}

function buildParamNames(typeCount: number, detectedVars: DetectedVariable[]): string[] {
  if (typeCount > 0 && detectedVars.length === typeCount) {
    return detectedVars.map((v) => v.name);
  }
  if (typeCount > 0) {
    return Array.from({ length: typeCount }, (_, i) => `arg${i + 1}`);
  }
  if (detectedVars.length > 0) return detectedVars.map((v) => v.name);
  return [];
}

function defaultReturnForType(outputType: string | undefined, language: "java" | "cpp" | "python"): string {
  const t = normalizeTypeName(outputType || "auto");

  if (language === "python") {
    if (t.includes("bool")) return "False";
    if (t.includes("[]")) return "[]";
    if (t.includes("string") || t.includes("str")) return '""';
    if (t.includes("double") || t.includes("float")) return "0.0";
    if (t.includes("int") || t.includes("long")) return "0";
    return "None";
  }

  if (language === "java") {
    if (t.includes("bool")) return "false";
    if (t.includes("string[]") || t.includes("str[]")) return "new String[0]";
    if (t.includes("double[]") || t.includes("float[]")) return "new double[0]";
    if (t.includes("bool[]")) return "new boolean[0]";
    if (t.includes("[]")) return "new int[0]";
    if (t.includes("string") || t.includes("str")) return "\"\"";
    if (t.includes("double") || t.includes("float")) return "0.0";
    if (t.includes("int") || t.includes("long")) return "0";
    return "null";
  }

  if (t.includes("bool")) return "false";
  if (t.includes("string[]") || t.includes("str[]")) return "{}";
  if (t.includes("double[]") || t.includes("float[]")) return "{}";
  if (t.includes("bool[]")) return "{}";
  if (t.includes("[]")) return "{}";
  if (t.includes("string") || t.includes("str")) return "\"\"";
  if (t.includes("double") || t.includes("float")) return "0.0";
  if (t.includes("int") || t.includes("long")) return "0";
  return "{}";
}

function buildJavaStarterCode(vars: DetectedVariable[], functionName: string, inputType?: string, outputType?: string): string {
  const paramTypes = parseTypeList(inputType);
  const paramNames = buildParamNames(paramTypes.length, vars);
  const params = paramTypes.length > 0
    ? paramTypes.map((type, idx) => `${mapToJavaType(type)} ${paramNames[idx]}`).join(", ")
    : "";
  const returnType = mapToJavaType(outputType || "auto");
  const fallbackReturn = defaultReturnForType(outputType, "java");
  return `class Solution {\n    public ${returnType} ${functionName}(${params}) {\n        \n    }\n}`;
}

function buildCppStarterCode(vars: DetectedVariable[], functionName: string, inputType?: string, outputType?: string): string {
  const paramTypes = parseTypeList(inputType);
  const paramNames = buildParamNames(paramTypes.length, vars);
  const params = paramTypes.length > 0
    ? paramTypes.map((type, idx) => `${mapToCppType(type)} ${paramNames[idx]}`).join(", ")
    : "";
  const returnType = mapToCppType(outputType || "auto");
  const fallbackReturn = defaultReturnForType(outputType, "cpp");
  return `class Solution {\npublic:\n    ${returnType} ${functionName}(${params}) {\n        \n    }\n};`;
}

function buildPythonStarterCode(vars: DetectedVariable[], functionName: string, inputType?: string, outputType?: string): string {
  const paramTypes = parseTypeList(inputType);
  const paramNames = buildParamNames(paramTypes.length, vars);
  const params = paramTypes.length > 0
    ? paramTypes.map((type, idx) => `${paramNames[idx]}: ${mapToPythonType(type)}`).join(", ")
    : "";
  const returnType = mapToPythonType(outputType || "auto");
  const fallbackReturn = defaultReturnForType(outputType, "python");
  return `class Solution:\n    def ${functionName}(self${params ? `, ${params}` : ""}) -> ${returnType}:\n        pass\n`;
}

function buildStarterCodeFromQuestion(
  question: Pick<CodingQuestion, "examples" | "title" | "function_name" | "input_type" | "output_type"> | null,
  language: "cpp" | "java" | "python"
): string {
  const firstExample = question?.examples?.[0]?.input;
  const vars = detectVariablesFromExample(firstExample);
  const inferredInputType = inferInputType(question?.input_type, vars);
  const inferredOutputType = inferOutputType(question?.output_type, question?.examples?.[0]?.output);
  const baseName = question?.function_name || question?.title || "solve";
  const camelName = toCamelCase(baseName);
  const snakeName = toSnakeCase(baseName);

  if (language === "java") return buildJavaStarterCode(vars, camelName, inferredInputType, inferredOutputType);
  if (language === "cpp") return buildCppStarterCode(vars, camelName, inferredInputType, inferredOutputType);
  return buildPythonStarterCode(vars, snakeName, inferredInputType, inferredOutputType);
}

export function getStarterCodeForQuestion(
  question: Pick<CodingQuestion, "starter_code" | "examples" | "title" | "function_name" | "input_type" | "output_type"> | null,
  language: "cpp" | "java" | "python"
): string {
  return buildStarterCodeFromQuestion(question, language);
}

export const MOCK_QUESTIONS: CodingQuestion[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: ["arrays", "hashmap"],
    acceptance_rate: 49,
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume exactly one solution exists and you may not use the same element twice.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9.",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
    ],
    testcases: [
      { input: "2 7 11 15\n9", expectedOutput: "0 1" },
      { input: "3 2 4\n6", expectedOutput: "1 2" },
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n`,
    },
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: ["stack", "strings"],
    acceptance_rate: 41,
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    testcases: [
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" },
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        pass\n`,
    },
  },
  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: ["sliding-window", "strings"],
    acceptance_rate: 36,
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' },
      { input: 's = "bbbbb"', output: "1" },
    ],
    testcases: [
      { input: "abcabcbb", expectedOutput: "3" },
      { input: "bbbbb", expectedOutput: "1" },
    ],
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: ["arrays", "sorting"],
    acceptance_rate: 47,
    description:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.",
    examples: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
    ],
    testcases: [
      { input: "1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18" },
    ],
  },
  {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topic: ["binary-search", "arrays"],
    acceptance_rate: 34,
    description:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log (m+n)).",
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.0" },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.5" },
    ],
    testcases: [
      { input: "1 3\n2", expectedOutput: "2.0" },
      { input: "1 2\n3 4", expectedOutput: "2.5" },
    ],
  },
];

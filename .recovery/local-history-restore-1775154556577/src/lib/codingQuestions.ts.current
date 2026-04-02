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
};

export const LANGUAGE_TO_JUDGE0: Record<string, number> = {
  cpp: 54,
  java: 62,
  python: 71,
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

function normalizeStringLiteral(raw: string): string {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) return value;
  if (value.startsWith("'") && value.endsWith("'")) {
    return `"${value.slice(1, -1).replace(/"/g, '\\"')}"`;
  }
  return `"${value.replace(/"/g, '\\"')}"`;
}

function javaTypeAndValue(raw: string): { typeName: string; value: string } {
  const value = raw.trim();
  if (/^\[\[.*\]\]$/.test(value)) return { typeName: "int[][]", value: `new int[][]${value}` };
  if (/^\[.*\]$/.test(value)) return { typeName: "int[]", value: `new int[]${value}` };
  if (/^(true|false)$/i.test(value)) return { typeName: "boolean", value: value.toLowerCase() };
  if (/^-?\d+$/.test(value)) return { typeName: "int", value };
  if (/^-?\d+\.\d+$/.test(value)) return { typeName: "double", value };
  return { typeName: "String", value: normalizeStringLiteral(value) };
}

function cppTypeAndValue(raw: string): { typeName: string; value: string } {
  const value = raw.trim();
  if (/^\[\[.*\]\]$/.test(value)) return { typeName: "vector<vector<int>>", value: value.replace(/\[/g, "{").replace(/\]/g, "}") };
  if (/^\[.*\]$/.test(value)) return { typeName: "vector<int>", value: value.replace(/\[/g, "{").replace(/\]/g, "}") };
  if (/^(true|false)$/i.test(value)) return { typeName: "bool", value: value.toLowerCase() };
  if (/^-?\d+$/.test(value)) return { typeName: "int", value };
  if (/^-?\d+\.\d+$/.test(value)) return { typeName: "double", value };
  return { typeName: "string", value: normalizeStringLiteral(value) };
}

function pythonValue(raw: string): string {
  const value = raw.trim();
  if (value.startsWith("[") || /^-?\d/.test(value) || /^(True|False|true|false)$/.test(value)) return value.replace(/\btrue\b/gi, "True").replace(/\bfalse\b/gi, "False");
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) return value;
  return normalizeStringLiteral(value);
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
  if (!raw || raw.toLowerCase() === "auto") return [];
  return splitTopLevel(raw).map((t) => t.trim()).filter(Boolean);
}

function normalizeTypeName(type: string): string {
  return String(type || "").toLowerCase().replace(/\s+/g, "");
}

function mapToJavaType(type: string): string {
  const t = normalizeTypeName(type);
  if (!t || t === "auto") return "Object";
  if (t.includes("[][]")) return "int[][]";
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
  if (t.includes("[][]")) return "vector<vector<int>>";
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
  if (t.includes("[][]")) return "list[list[int]]";
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
    if (t.includes("[]")) return "new int[0]";
    if (t.includes("string") || t.includes("str")) return "\"\"";
    if (t.includes("double") || t.includes("float")) return "0.0";
    if (t.includes("int") || t.includes("long")) return "0";
    return "null";
  }

  if (t.includes("bool")) return "false";
  if (t.includes("[]")) return "{}";
  if (t.includes("string") || t.includes("str")) return "\"\"";
  if (t.includes("double") || t.includes("float")) return "0.0";
  if (t.includes("int") || t.includes("long")) return "0";
  return "{}";
}

function buildJavaStarterCode(vars: DetectedVariable[], functionName: string, inputType?: string, outputType?: string): string {
  const paramTypes = parseTypeList(inputType);
  const paramNames = buildParamNames(paramTypes.length, vars);

  const params =
    paramTypes.length > 0
      ? paramTypes.map((type, idx) => `${mapToJavaType(type)} ${paramNames[idx]}`).join(", ")
      : vars
          .map((v) => {
            const typed = javaTypeAndValue(v.rawValue);
            return `${typed.typeName} ${v.name}`;
          })
          .join(", ");

  const returnType = mapToJavaType(outputType || "auto");
  const fallbackReturn = defaultReturnForType(outputType, "java");

  return `class Solution {\n    public ${returnType} ${functionName}(${params}) {\n        // Write your solution logic here.\n        return ${fallbackReturn};\n    }\n}`;
}

function buildCppStarterCode(vars: DetectedVariable[], functionName: string, inputType?: string, outputType?: string): string {
  const paramTypes = parseTypeList(inputType);
  const paramNames = buildParamNames(paramTypes.length, vars);

  const params =
    paramTypes.length > 0
      ? paramTypes.map((type, idx) => `${mapToCppType(type)} ${paramNames[idx]}`).join(", ")
      : vars
          .map((v) => {
            const typed = cppTypeAndValue(v.rawValue);
            return `${typed.typeName} ${v.name}`;
          })
          .join(", ");

  const returnType = mapToCppType(outputType || "auto");
  const fallbackReturn = defaultReturnForType(outputType, "cpp");

  return `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${returnType} ${functionName}(${params}) {\n        // Write your solution logic here.\n        return ${fallbackReturn};\n    }\n};`;
}

function buildPythonStarterCode(vars: DetectedVariable[], functionName: string, inputType?: string, outputType?: string): string {
  const paramTypes = parseTypeList(inputType);
  const paramNames = buildParamNames(paramTypes.length, vars);
  const params =
    paramTypes.length > 0
      ? paramTypes.map((type, idx) => `${paramNames[idx]}: ${mapToPythonType(type)}`).join(", ")
      : vars.map((v) => v.name).join(", ");
  const paramHints = vars.map((v) => `${v.name}=${pythonValue(v.rawValue)}`).join(", ");
  const returnType = mapToPythonType(outputType || "auto");
  const fallbackReturn = defaultReturnForType(outputType, "python");
  return `from typing import Any\n\nclass Solution:\n    def ${functionName}(self${params ? `, ${params}` : ""}) -> ${returnType}:\n        # Write your solution logic here.\n${paramHints ? `        # Example values: ${paramHints}\n` : ""}        return ${fallbackReturn}\n`;
}

function buildStarterCodeFromQuestion(
  question: Pick<CodingQuestion, "examples" | "title" | "function_name" | "input_type" | "output_type"> | null,
  language: "cpp" | "java" | "python"
): string {
  const firstExample = question?.examples?.[0]?.input;
  const vars = detectVariablesFromExample(firstExample);
  const baseName = question?.function_name || question?.title || "solve";
  const camelName = toCamelCase(baseName);
  const snakeName = toSnakeCase(baseName);

  if (language === "java") return buildJavaStarterCode(vars, camelName, question?.input_type, question?.output_type);
  if (language === "cpp") return buildCppStarterCode(vars, camelName, question?.input_type, question?.output_type);
  return buildPythonStarterCode(vars, snakeName, question?.input_type, question?.output_type);
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
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < (int)nums.size(); i++) {\n        int need = target - nums[i];\n        if (seen.count(need)) return {seen[need], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n\nint main() {\n    // Read nums and target, then print indices\n    return 0;\n}`,
      java: `import java.util.*;\n\npublic class Main {\n    static int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int need = target - nums[i];\n            if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n\n    public static void main(String[] args) {\n        // Read nums and target, then print indices\n    }\n}`,
      python: `def two_sum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        need = target - x\n        if need in seen:\n            return [seen[need], i]\n        seen[x] = i\n    return []\n\nif __name__ == "__main__":\n    # Read nums and target, then print indices\n    pass\n`,
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
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool isValid(string s) {\n    unordered_map<char, char> closeToOpen{{')','('}, {']','['}, {'}','{'}};\n    stack<char> st;\n    for (char c : s) {\n        if (!closeToOpen.count(c)) st.push(c);\n        else {\n            if (st.empty() || st.top() != closeToOpen[c]) return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}\n\nint main() {\n    // Read string s and print true/false\n    return 0;\n}`,
      java: `import java.util.*;\n\npublic class Main {\n    static boolean isValid(String s) {\n        Map<Character, Character> closeToOpen = Map.of(')', '(', ']', '[', '}', '{');\n        Deque<Character> st = new ArrayDeque<>();\n        for (char c : s.toCharArray()) {\n            if (!closeToOpen.containsKey(c)) st.push(c);\n            else {\n                if (st.isEmpty() || st.peek() != closeToOpen.get(c)) return false;\n                st.pop();\n            }\n        }\n        return st.isEmpty();\n    }\n\n    public static void main(String[] args) {\n        // Read string s and print true/false\n    }\n}`,
      python: `def is_valid(s: str) -> bool:\n    close_to_open = {')': '(', ']': '[', '}': '{'}\n    st = []\n    for ch in s:\n        if ch not in close_to_open:\n            st.append(ch)\n        else:\n            if not st or st[-1] != close_to_open[ch]:\n                return False\n            st.pop()\n    return len(st) == 0\n\nif __name__ == "__main__":\n    # Read s and print true/false\n    pass\n`,
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

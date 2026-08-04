export type Difficulty = "Easy" | "Medium" | "Hard";

export type QuestionTestCase = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
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
  expected_time_complexity?: string;
  expected_space_complexity?: string;
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

export function sanitizeFunctionName(name: string | undefined, defaultName = "solve"): string {
  if (!name) return defaultName;
  const cleaned = String(name)
    .replace(/^[^a-zA-Z_]+/, "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (!cleaned || /^[0-9]/.test(cleaned)) return defaultName;
  return cleaned;
}

function buildStarterCodeFromQuestion(
  question: Pick<CodingQuestion, "examples" | "title" | "function_name" | "input_type" | "output_type"> | null,
  language: "cpp" | "java" | "python"
): string {
  const firstExample = question?.examples?.[0]?.input;
  const vars = detectVariablesFromExample(firstExample);
  const inferredInputType = inferInputType(question?.input_type, vars);
  const inferredOutputType = inferOutputType(question?.output_type, question?.examples?.[0]?.output);
  const rawBaseName = question?.function_name || question?.title || "solve";
  const safeBaseName = sanitizeFunctionName(rawBaseName, "solve");
  const camelName = toCamelCase(safeBaseName);
  const snakeName = toSnakeCase(safeBaseName);

  if (language === "java") return buildJavaStarterCode(vars, camelName, inferredInputType, inferredOutputType);
  if (language === "cpp") return buildCppStarterCode(vars, camelName, inferredInputType, inferredOutputType);
  return buildPythonStarterCode(vars, snakeName, inferredInputType, inferredOutputType);
}

export function getStarterCodeForQuestion(
  question: Pick<CodingQuestion, "starter_code" | "examples" | "title" | "function_name" | "input_type" | "output_type"> | null,
  language: "cpp" | "java" | "python"
): string {
  if (question?.starter_code && typeof question.starter_code[language] === "string" && question.starter_code[language]!.trim().length > 0) {
    return question.starter_code[language]!;
  }
  return buildStarterCodeFromQuestion(question, language);
}

export const MOCK_QUESTIONS: CodingQuestion[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    section: "Arrays & Strings",
    topic: ["arrays", "hash-table"],
    company_tags: ["google", "amazon", "meta", "tcs"],
    pattern_tags: ["two-pointers", "hash-table"],
    acceptance_rate: 49,
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume exactly one solution exists and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    testcases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[4,6,10]\n14", expectedOutput: "[0,2]", isHidden: true },
      { input: "[6,9,15]\n21", expectedOutput: "[0,2]", isHidden: true },
      { input: "[8,12,20]\n28", expectedOutput: "[0,2]", isHidden: true },
      { input: "[10,15,25]\n35", expectedOutput: "[0,2]", isHidden: true },
      { input: "[12,18,30]\n42", expectedOutput: "[0,2]", isHidden: true },
      { input: "[14,21,35]\n49", expectedOutput: "[0,2]", isHidden: true },
      { input: "[16,24,40]\n56", expectedOutput: "[0,2]", isHidden: true },
      { input: "[18,27,45]\n63", expectedOutput: "[0,2]", isHidden: true },
      { input: "[20,30,50]\n70", expectedOutput: "[0,2]", isHidden: true },
      { input: "[22,33,55]\n77", expectedOutput: "[0,2]", isHidden: true },
      { input: "[24,36,60]\n84", expectedOutput: "[0,2]", isHidden: true },
      { input: "[26,39,65]\n91", expectedOutput: "[0,2]", isHidden: true },
      { input: "[28,42,70]\n98", expectedOutput: "[0,2]", isHidden: true },
      { input: "[30,45,75]\n105", expectedOutput: "[0,2]", isHidden: true },
      { input: "[32,48,80]\n112", expectedOutput: "[0,2]", isHidden: true },
      { input: "[34,51,85]\n119", expectedOutput: "[0,2]", isHidden: true },
      { input: "[36,54,90]\n126", expectedOutput: "[0,2]", isHidden: true },
      { input: "[38,57,95]\n133", expectedOutput: "[0,2]", isHidden: true },
      { input: "[40,60,100]\n140", expectedOutput: "[0,2]", isHidden: true },
      { input: "[42,63,105]\n147", expectedOutput: "[0,2]", isHidden: true },
      { input: "[44,66,110]\n154", expectedOutput: "[0,2]", isHidden: true },
      { input: "[46,69,115]\n161", expectedOutput: "[0,2]", isHidden: true },
      { input: "[48,72,120]\n168", expectedOutput: "[0,2]", isHidden: true },
      { input: "[50,75,125]\n175", expectedOutput: "[0,2]", isHidden: true },
      { input: "[52,78,130]\n182", expectedOutput: "[0,2]", isHidden: true },
      { input: "[54,81,135]\n189", expectedOutput: "[0,2]", isHidden: true },
      { input: "[56,84,140]\n196", expectedOutput: "[0,2]", isHidden: true },
      { input: "[58,87,145]\n203", expectedOutput: "[0,2]", isHidden: true },
      { input: "[60,90,150]\n210", expectedOutput: "[0,2]", isHidden: true },
      { input: "[62,93,155]\n217", expectedOutput: "[0,2]", isHidden: true },
      { input: "[64,96,160]\n224", expectedOutput: "[0,2]", isHidden: true },
      { input: "[66,99,165]\n231", expectedOutput: "[0,2]", isHidden: true },
      { input: "[68,102,170]\n238", expectedOutput: "[0,2]", isHidden: true },
      { input: "[70,105,175]\n245", expectedOutput: "[0,2]", isHidden: true },
      { input: "[72,108,180]\n252", expectedOutput: "[0,2]", isHidden: true },
      { input: "[74,111,185]\n259", expectedOutput: "[0,2]", isHidden: true },
      { input: "[76,114,190]\n266", expectedOutput: "[0,2]", isHidden: true },
      { input: "[78,117,195]\n273", expectedOutput: "[0,2]", isHidden: true },
      { input: "[80,120,200]\n280", expectedOutput: "[0,2]", isHidden: true },
      { input: "[82,123,205]\n287", expectedOutput: "[0,2]", isHidden: true },
      { input: "[84,126,210]\n294", expectedOutput: "[0,2]", isHidden: true },
      { input: "[86,129,215]\n301", expectedOutput: "[0,2]", isHidden: true },
      { input: "[88,132,220]\n308", expectedOutput: "[0,2]", isHidden: true },
      { input: "[90,135,225]\n315", expectedOutput: "[0,2]", isHidden: true },
      { input: "[92,138,230]\n322", expectedOutput: "[0,2]", isHidden: true },
      { input: "[94,141,235]\n329", expectedOutput: "[0,2]", isHidden: true },
      { input: "[96,144,240]\n336", expectedOutput: "[0,2]", isHidden: true },
      { input: "[98,147,245]\n343", expectedOutput: "[0,2]", isHidden: true },
      { input: "[100,150,250]\n350", expectedOutput: "[0,2]", isHidden: true },
      { input: "[102,153,255]\n357", expectedOutput: "[0,2]", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (mp.count(diff)) return {mp[diff], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) return new int[] { map.get(diff), i };\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`,
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen: return [seen[diff], i]\n            seen[num] = i\n        return []\n`
    }
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    section: "Arrays & Strings",
    topic: ["stack", "strings"],
    company_tags: ["amazon", "meta", "microsoft", "infosys"],
    pattern_tags: ["stack"],
    acceptance_rate: 41,
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" }
    ],
    testcases: [
      { input: "\"()\"", expectedOutput: "true" },
      { input: "\"()[]{}\"", expectedOutput: "true" },
      { input: "\"(]\"", expectedOutput: "false", isHidden: true },
      { input: "\"([)]\"", expectedOutput: "false", isHidden: true },
      { input: "\"{[]}\"", expectedOutput: "true", isHidden: true },
      { input: "\"({[)]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"((()\"", expectedOutput: "false", isHidden: true },
      { input: "\"{}[][]{}()\"", expectedOutput: "true", isHidden: true },
      { input: "\"{[()()]}\"", expectedOutput: "true", isHidden: true },
      { input: "\"[{]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"(((((())))))\"", expectedOutput: "true", isHidden: true },
      { input: "\"(()\"", expectedOutput: "false", isHidden: true },
      { input: "\"()()()()\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((())))\"", expectedOutput: "true", isHidden: true },
      { input: "\"([{}])\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((\"", expectedOutput: "false", isHidden: true },
      { input: "\")))\"", expectedOutput: "false", isHidden: true },
      { input: "\"({[)]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"((()\"", expectedOutput: "false", isHidden: true },
      { input: "\"{}[][]{}()\"", expectedOutput: "true", isHidden: true },
      { input: "\"{[()()]}\"", expectedOutput: "true", isHidden: true },
      { input: "\"[{]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"(((((())))))\"", expectedOutput: "true", isHidden: true },
      { input: "\"(()\"", expectedOutput: "false", isHidden: true },
      { input: "\"()()()()\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((())))\"", expectedOutput: "true", isHidden: true },
      { input: "\"([{}])\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((\"", expectedOutput: "false", isHidden: true },
      { input: "\")))\"", expectedOutput: "false", isHidden: true },
      { input: "\"({[)]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"((()\"", expectedOutput: "false", isHidden: true },
      { input: "\"{}[][]{}()\"", expectedOutput: "true", isHidden: true },
      { input: "\"{[()()]}\"", expectedOutput: "true", isHidden: true },
      { input: "\"[{]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"(((((())))))\"", expectedOutput: "true", isHidden: true },
      { input: "\"(()\"", expectedOutput: "false", isHidden: true },
      { input: "\"()()()()\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((())))\"", expectedOutput: "true", isHidden: true },
      { input: "\"([{}])\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((\"", expectedOutput: "false", isHidden: true },
      { input: "\")))\"", expectedOutput: "false", isHidden: true },
      { input: "\"({[)]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"((()\"", expectedOutput: "false", isHidden: true },
      { input: "\"{}[][]{}()\"", expectedOutput: "true", isHidden: true },
      { input: "\"{[()()]}\"", expectedOutput: "true", isHidden: true },
      { input: "\"[{]}\"", expectedOutput: "false", isHidden: true },
      { input: "\"(((((())))))\"", expectedOutput: "true", isHidden: true },
      { input: "\"(()\"", expectedOutput: "false", isHidden: true },
      { input: "\"()()()()\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((())))\"", expectedOutput: "true", isHidden: true },
      { input: "\"([{}])\"", expectedOutput: "true", isHidden: true },
      { input: "\"(((\"", expectedOutput: "false", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.empty()) return false;\n                if (c == ')' && st.top() != '(') return false;\n                if (c == '}' && st.top() != '{') return false;\n                if (c == ']' && st.top() != '[') return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {")": "(", "}": "{", "]": "["}\n        for char in s:\n            if char in mapping:\n                top = stack.pop() if stack else '#'\n                if mapping[char] != top: return False\n            else: stack.append(char)\n        return not stack\n`
    }
  },
  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    section: "Arrays & Strings",
    topic: ["sliding-window", "strings"],
    company_tags: ["google", "amazon", "tcs", "wipro"],
    pattern_tags: ["sliding-window"],
    acceptance_rate: 36,
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' },
      { input: 's = "bbbbb"', output: "1" }
    ],
    testcases: [
      { input: "\"abcabcbb\"", expectedOutput: "3" },
      { input: "\"bbbbb\"", expectedOutput: "1" },
      { input: "\"pwwkew\"", expectedOutput: "3", isHidden: true },
      { input: "\"\"", expectedOutput: "0", isHidden: true },
      { input: "\"au\"", expectedOutput: "2", isHidden: true },
      { input: "\"xyzxyzxyz\"", expectedOutput: "3", isHidden: true },
      { input: "\"aaaaaa\"", expectedOutput: "1", isHidden: true },
      { input: "\"anviaj\"", expectedOutput: "5", isHidden: true },
      { input: "\"tmmzuxt\"", expectedOutput: "5", isHidden: true },
      { input: "\"jbpnbfkl\"", expectedOutput: "7", isHidden: true },
      { input: "\"dvdf\"", expectedOutput: "3", isHidden: true },
      { input: "\"abcdef\"", expectedOutput: "6", isHidden: true },
      { input: "\"a\"", expectedOutput: "1", isHidden: true },
      { input: "\"ab\"", expectedOutput: "2", isHidden: true },
      { input: "\"abcdeffgh\"", expectedOutput: "6", isHidden: true },
      { input: "\"xyzxyzxyz\"", expectedOutput: "3", isHidden: true },
      { input: "\"aaaaaa\"", expectedOutput: "1", isHidden: true },
      { input: "\"anviaj\"", expectedOutput: "5", isHidden: true },
      { input: "\"tmmzuxt\"", expectedOutput: "5", isHidden: true },
      { input: "\"jbpnbfkl\"", expectedOutput: "7", isHidden: true },
      { input: "\"dvdf\"", expectedOutput: "3", isHidden: true },
      { input: "\"abcdef\"", expectedOutput: "6", isHidden: true },
      { input: "\"a\"", expectedOutput: "1", isHidden: true },
      { input: "\"ab\"", expectedOutput: "2", isHidden: true },
      { input: "\"abcdeffgh\"", expectedOutput: "6", isHidden: true },
      { input: "\"xyzxyzxyz\"", expectedOutput: "3", isHidden: true },
      { input: "\"aaaaaa\"", expectedOutput: "1", isHidden: true },
      { input: "\"anviaj\"", expectedOutput: "5", isHidden: true },
      { input: "\"tmmzuxt\"", expectedOutput: "5", isHidden: true },
      { input: "\"jbpnbfkl\"", expectedOutput: "7", isHidden: true },
      { input: "\"dvdf\"", expectedOutput: "3", isHidden: true },
      { input: "\"abcdef\"", expectedOutput: "6", isHidden: true },
      { input: "\"a\"", expectedOutput: "1", isHidden: true },
      { input: "\"ab\"", expectedOutput: "2", isHidden: true },
      { input: "\"abcdeffgh\"", expectedOutput: "6", isHidden: true },
      { input: "\"xyzxyzxyz\"", expectedOutput: "3", isHidden: true },
      { input: "\"aaaaaa\"", expectedOutput: "1", isHidden: true },
      { input: "\"anviaj\"", expectedOutput: "5", isHidden: true },
      { input: "\"tmmzuxt\"", expectedOutput: "5", isHidden: true },
      { input: "\"jbpnbfkl\"", expectedOutput: "7", isHidden: true },
      { input: "\"dvdf\"", expectedOutput: "3", isHidden: true },
      { input: "\"abcdef\"", expectedOutput: "6", isHidden: true },
      { input: "\"a\"", expectedOutput: "1", isHidden: true },
      { input: "\"ab\"", expectedOutput: "2", isHidden: true },
      { input: "\"abcdeffgh\"", expectedOutput: "6", isHidden: true },
      { input: "\"xyzxyzxyz\"", expectedOutput: "3", isHidden: true },
      { input: "\"aaaaaa\"", expectedOutput: "1", isHidden: true },
      { input: "\"anviaj\"", expectedOutput: "5", isHidden: true },
      { input: "\"tmmzuxt\"", expectedOutput: "5", isHidden: true },
      { input: "\"jbpnbfkl\"", expectedOutput: "7", isHidden: true },
      { input: "\"dvdf\"", expectedOutput: "3", isHidden: true },
      { input: "\"abcdef\"", expectedOutput: "6", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_set<char> st;\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (st.count(s[right])) {\n                st.erase(s[left]);\n                left++;\n            }\n            st.insert(s[right]);\n            maxLen = max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n};`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        Set<Character> set = new HashSet<>();\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (set.contains(s.charAt(right))) {\n                set.remove(s.charAt(left));\n                left++;\n            }\n            set.add(s.charAt(right));\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}`,
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_set = set()\n        l = 0\n        res = 0\n        for r in range(len(s)):\n            while s[r] in char_set:\n                char_set.remove(s[l])\n                l += 1\n            char_set.add(s[r])\n            res = max(res, r - l + 1)\n        return res\n`
    }
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    section: "Arrays & Strings",
    topic: ["two-pointers", "arrays"],
    company_tags: ["google", "meta", "amazon", "cognizant"],
    pattern_tags: ["two-pointers"],
    acceptance_rate: 54,
    description: "Given n non-negative integers height where each represents a point at coordinate (i, height[i]), find two lines that together with the x-axis form a container containing the most water.",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" }
    ],
    testcases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49" },
      { input: "[1,1]", expectedOutput: "1" },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true },
      { input: "[1,2,4,3]", expectedOutput: "4", isHidden: true },
      { input: "[2,3,10,5,7,8,9]", expectedOutput: "36", isHidden: true },
      { input: "[1,8,6,2,5,4,8,25,7]", expectedOutput: "49", isHidden: true },
      { input: "[10,9,8,7,6,5,4,3,2,1]", expectedOutput: "25", isHidden: true },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[-1,-1]", expectedOutput: "0", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true },
      { input: "[1,2,4,3]", expectedOutput: "4", isHidden: true },
      { input: "[2,3,10,5,7,8,9]", expectedOutput: "36", isHidden: true },
      { input: "[1,8,6,2,5,4,8,25,7]", expectedOutput: "49", isHidden: true },
      { input: "[10,9,8,7,6,5,4,3,2,1]", expectedOutput: "25", isHidden: true },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[-1,-1]", expectedOutput: "0", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true },
      { input: "[1,2,4,3]", expectedOutput: "4", isHidden: true },
      { input: "[2,3,10,5,7,8,9]", expectedOutput: "36", isHidden: true },
      { input: "[1,8,6,2,5,4,8,25,7]", expectedOutput: "49", isHidden: true },
      { input: "[10,9,8,7,6,5,4,3,2,1]", expectedOutput: "25", isHidden: true },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[-1,-1]", expectedOutput: "0", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true },
      { input: "[1,2,4,3]", expectedOutput: "4", isHidden: true },
      { input: "[2,3,10,5,7,8,9]", expectedOutput: "36", isHidden: true },
      { input: "[1,8,6,2,5,4,8,25,7]", expectedOutput: "49", isHidden: true },
      { input: "[10,9,8,7,6,5,4,3,2,1]", expectedOutput: "25", isHidden: true },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[-1,-1]", expectedOutput: "0", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true },
      { input: "[1,2,4,3]", expectedOutput: "4", isHidden: true },
      { input: "[2,3,10,5,7,8,9]", expectedOutput: "36", isHidden: true },
      { input: "[1,8,6,2,5,4,8,25,7]", expectedOutput: "49", isHidden: true },
      { input: "[10,9,8,7,6,5,4,3,2,1]", expectedOutput: "25", isHidden: true },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[-1,-1]", expectedOutput: "0", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true },
      { input: "[1,2,4,3]", expectedOutput: "4", isHidden: true },
      { input: "[2,3,10,5,7,8,9]", expectedOutput: "36", isHidden: true },
      { input: "[1,8,6,2,5,4,8,25,7]", expectedOutput: "49", isHidden: true },
      { input: "[10,9,8,7,6,5,4,3,2,1]", expectedOutput: "25", isHidden: true },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[-1,-1]", expectedOutput: "0", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
      { input: "[2,3,4,5,18,17,6]", expectedOutput: "17", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int l = 0, r = height.size() - 1, maxA = 0;\n        while (l < r) {\n            int area = min(height[l], height[r]) * (r - l);\n            maxA = max(maxA, area);\n            if (height[l] < height[r]) l++; else r--;\n        }\n        return maxA;\n    }\n};`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        int l = 0, r = height.length - 1, maxA = 0;\n        while (l < r) {\n            int area = Math.min(height[l], height[r]) * (r - l);\n            maxA = Math.max(maxA, area);\n            if (height[l] < height[r]) l++; else r--;\n        }\n        return maxA;\n    }\n}`,
      python: `class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        l, r = 0, len(height) - 1\n        res = 0\n        while l < r:\n            area = min(height[l], height[r]) * (r - l)\n            res = max(res, area)\n            if height[l] < height[r]: l += 1\n            else: r -= 1\n        return res\n`
    }
  },
  {
    id: "3sum",
    title: "3Sum",
    difficulty: "Medium",
    section: "Arrays & Strings",
    topic: ["two-pointers", "sorting", "arrays"],
    company_tags: ["amazon", "facebook", "tcs", "capgemini"],
    pattern_tags: ["two-pointers"],
    acceptance_rate: 33,
    description: "Given an integer array nums, return all triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }
    ],
    testcases: [
      { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
      { input: "[0,1,1]", expectedOutput: "[]" },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true },
      { input: "[-2,0,0,2,2]", expectedOutput: "[[-2,0,2]]", isHidden: true },
      { input: "[1,2,-2,-1]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true },
      { input: "[-1,0,1]", expectedOutput: "[[-1,0,1]]", isHidden: true },
      { input: "[-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", expectedOutput: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        sort(nums.begin(), nums.end());\n        vector<vector<int>> res;\n        for (int i = 0; i < (int)nums.size() - 2; i++) {\n            if (i > 0 && nums[i] == nums[i-1]) continue;\n            int l = i + 1, r = nums.size() - 1;\n            while (l < r) {\n                int s = nums[i] + nums[l] + nums[r];\n                if (s == 0) {\n                    res.push_back({nums[i], nums[l], nums[r]});\n                    while (l < r && nums[l] == nums[l+1]) l++;\n                    while (l < r && nums[r] == nums[r-1]) r--;\n                    l++; r--;\n                } else if (s < 0) l++; else r--;\n            }\n        }\n        return res;\n    }\n};`,
      java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        Arrays.sort(nums);\n        List<List<Integer>> res = new ArrayList<>();\n        for (int i = 0; i < nums.length - 2; i++) {\n            if (i > 0 && nums[i] == nums[i-1]) continue;\n            int l = i + 1, r = nums.length - 1;\n            while (l < r) {\n                int sum = nums[i] + nums[l] + nums[r];\n                if (sum == 0) {\n                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));\n                    while (l < r && nums[l] == nums[l+1]) l++;\n                    while (l < r && nums[r] == nums[r-1]) r--;\n                    l++; r--;\n                } else if (sum < 0) l++; else r--;\n            }\n        }\n        return res;\n    }\n}`,
      python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        nums.sort()\n        res = []\n        for i in range(len(nums) - 2):\n            if i > 0 and nums[i] == nums[i-1]: continue\n            l, r = i + 1, len(nums) - 1\n            while l < r:\n                s = nums[i] + nums[l] + nums[r]\n                if s == 0:\n                    res.append([nums[i], nums[l], nums[r]])\n                    while l < r and nums[l] == nums[l+1]: l += 1\n                    while l < r and nums[r] == nums[r-1]: r -= 1\n                    l += 1; r -= 1\n                elif s < 0: l += 1\n                else: r -= 1\n        return res\n`
    }
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    section: "Trees & Graphs",
    topic: ["graphs", "bfs", "dfs"],
    company_tags: ["amazon", "google", "microsoft", "accenture"],
    pattern_tags: ["dfs", "bfs"],
    acceptance_rate: 57,
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    examples: [
      { input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: "2" }
    ],
    testcases: [
      { input: "[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", expectedOutput: "1" },
      { input: "[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", expectedOutput: "3" },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", isHidden: true },
      { input: "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"1\"]]", expectedOutput: "1", isHidden: true },
      { input: "[[\"0\"]]", expectedOutput: "0", isHidden: true },
      { input: "[[\"1\",\"0\"],[\"0\",\"1\"]]", expectedOutput: "2", isHidden: true },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expectedOutput: "1", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        int count = 0;\n        for (int r = 0; r < grid.size(); r++) {\n            for (int c = 0; c < grid[0].size(); c++) {\n                if (grid[r][c] == '1') { count++; dfs(grid, r, c); }\n            }\n        }\n        return count;\n    }\n    void dfs(vector<vector<char>>& grid, int r, int c) {\n        if (r < 0 || c < 0 || r >= grid.size() || c >= grid[0].size() || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r+1, c); dfs(grid, r-1, c); dfs(grid, r, c+1); dfs(grid, r, c-1);\n    }\n};`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        int count = 0;\n        for (int r = 0; r < grid.length; r++) {\n            for (int c = 0; c < grid[0].length; c++) {\n                if (grid[r][c] == '1') { count++; dfs(grid, r, c); }\n            }\n        }\n        return count;\n    }\n    private void dfs(char[][] grid, int r, int c) {\n        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r+1, c); dfs(grid, r-1, c); dfs(grid, r, c+1); dfs(grid, r, c-1);\n    }\n}`,
      python: `class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        if not grid: return 0\n        rows, cols = len(grid), len(grid[0])\n        count = 0\n        def dfs(r, c):\n            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] == '0': return\n            grid[r][c] = '0'\n            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n        for r in range(rows):\n            for c in range(cols):\n                if grid[r][c] == '1':\n                    count += 1\n                    dfs(r, c)\n        return count\n`
    }
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    section: "Dynamic Programming",
    topic: ["dynamic-programming", "memoization"],
    company_tags: ["amazon", "google", "meta", "infosys"],
    pattern_tags: ["dp"],
    acceptance_rate: 42,
    description: "Given an integer array coins representing coins of different denominations and an integer amount, return the fewest number of coins needed to make up that amount.",
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3" }
    ],
    testcases: [
      { input: "[1,2,5]\n11", expectedOutput: "3" },
      { input: "[2]\n3", expectedOutput: "-1" },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
      { input: "[2,5,10,1]\n27", expectedOutput: "4", isHidden: true },
      { input: "[5,10]\n8", expectedOutput: "-1", isHidden: true },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[1,3,4]\n6", expectedOutput: "2", isHidden: true },
      { input: "[1,2,5]\n100", expectedOutput: "20", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        vector<int> dp(amount + 1, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) if (i - c >= 0) dp[i] = min(dp[i], dp[i-c] + 1);\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n};`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i-c] + 1);\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}`,
      python: `class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        dp = [float('inf')] * (amount + 1)\n        dp[0] = 0\n        for i in range(1, amount + 1):\n            for c in coins:\n                if i - c >= 0: dp[i] = min(dp[i], dp[i-c] + 1)\n        return dp[amount] if dp[amount] != float('inf') else -1\n`
    }
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    section: "Arrays & Strings",
    topic: ["linked-list", "pointers"],
    company_tags: ["amazon", "microsoft", "tcs", "wipro"],
    pattern_tags: ["pointers"],
    acceptance_rate: 73,
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }
    ],
    testcases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
      { input: "[1,2]", expectedOutput: "[2,1]" },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true },
      { input: "[1,2,3]", expectedOutput: "[3,2,1]", isHidden: true },
      { input: "[10,20,30,40]", expectedOutput: "[40,30,20,10]", isHidden: true },
      { input: "[5,4,3,2,1,0]", expectedOutput: "[0,1,2,3,4,5]", isHidden: true },
      { input: "[]", expectedOutput: "[]", isHidden: true },
      { input: "[1]", expectedOutput: "[1]", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode *prev = nullptr, *curr = head;\n        while (curr) {\n            ListNode* next = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n};`,
      java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode next = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n}`,
      python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev, curr = None, head\n        while curr:\n            nxt = curr.next\n            curr.next = prev\n            prev = curr\n            curr = nxt\n        return prev\n`
    }
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    section: "Arrays & Strings",
    topic: ["linked-list", "heap"],
    company_tags: ["google", "amazon", "meta"],
    pattern_tags: ["heap"],
    acceptance_rate: 49,
    description: "You are given an array of k linked-lists lists, each sorted in ascending order. Merge all into one sorted linked-list and return it.",
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }
    ],
    testcases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]" },
      { input: "[]", expectedOutput: "[]" },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[2,6],[1,4,5],[1,3,4]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: true },
      { input: "[[-1,1],[-3,1,4],[-2,-1,0,2]]", expectedOutput: "[-3,-2,-1,-1,0,1,1,2,4]", isHidden: true },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
      { input: "[[1]]", expectedOutput: "[1]", isHidden: true },
      { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]", isHidden: true },
      { input: "[[],[1],[]]", expectedOutput: "[1]", isHidden: true }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        auto comp = [](ListNode* a, ListNode* b){ return a->val > b->val; };\n        priority_queue<ListNode*, vector<ListNode*>, decltype(comp)> pq(comp);\n        for (auto node : lists) if (node) pq.push(node);\n        ListNode dummy(0), *tail = &dummy;\n        while (!pq.empty()) {\n            ListNode* top = pq.top(); pq.pop();\n            tail->next = top;\n            tail = tail->next;\n            if (top->next) pq.push(top->next);\n        }\n        return dummy.next;\n    }\n};`,
      java: `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        PriorityQueue<ListNode> pq = new PriorityQueue<>((a,b)->a.val - b.val);\n        for (ListNode node : lists) if (node != null) pq.add(node);\n        ListNode dummy = new ListNode(0), tail = dummy;\n        while (!pq.isEmpty()) {\n            ListNode min = pq.poll();\n            tail.next = min; tail = tail.next;\n            if (min.next != null) pq.add(min.next);\n        }\n        return dummy.next;\n    }\n}`,
      python: `class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        if not lists: return None\n        while len(lists) > 1:\n            merged = []\n            for i in range(0, len(lists), 2):\n                l1 = lists[i]\n                l2 = lists[i+1] if i + 1 < len(lists) else None\n                merged.append(self.merge2(l1, l2))\n            lists = merged\n        return lists[0]\n`
    }
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    section: "Stacks & Queues",
    topic: ["stack", "strings", "stack-patterns"],
    company_tags: ["amazon", "google", "meta", "tcs"],
    pattern_tags: ["stack", "stack-patterns"],
    acceptance_rate: 40,
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [{ input: "s = \"()[]{}\"", output: "true" }],
    testcases: [
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.empty()) return false;\n                if (c == ')' && st.top() != '(') return false;\n                if (c == '}' && st.top() != '{') return false;\n                if (c == ']' && st.top() != '[') return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        Stack<Character> st = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.isEmpty()) return false;\n                char top = st.pop();\n                if (c == ')' && top != '(') return false;\n                if (c == '}' && top != '{') return false;\n                if (c == ']' && top != '[') return false;\n            }\n        }\n        return st.isEmpty();\n    }\n}`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        st = []\n        mapping = {')': '(', '}': '{', ']': '['}\n        for c in s:\n            if c in mapping:\n                if not st or st.pop() != mapping[c]: return False\n            else: st.append(c)\n        return not st\n`
    }
  },
  {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    section: "Stacks & Queues",
    topic: ["stack", "monotonic-stack", "stack-patterns"],
    company_tags: ["amazon", "meta", "google"],
    pattern_tags: ["monotonic-stack", "stack-patterns"],
    acceptance_rate: 66,
    description: "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the i-th day to get a warmer temperature.",
    examples: [{ input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" }],
    testcases: [
      { input: "[73,74,75,71,69,72,76,73]", expectedOutput: "[1,1,4,2,1,1,0,0]" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        int n = temperatures.size();\n        vector<int> res(n, 0);\n        stack<int> st;\n        for (int i = 0; i < n; i++) {\n            while (!st.empty() && temperatures[i] > temperatures[st.top()]) {\n                int idx = st.top(); st.pop();\n                res[idx] = i - idx;\n            }\n            st.push(i);\n        }\n        return res;\n    }\n};`,
      java: `class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        int n = temperatures.length;\n        int[] res = new int[n];\n        Stack<Integer> st = new Stack<>();\n        for (int i = 0; i < n; i++) {\n            while (!st.isEmpty() && temperatures[i] > temperatures[st.peek()]) {\n                int idx = st.pop();\n                res[idx] = i - idx;\n            }\n            st.push(i);\n        }\n        return res;\n    }\n}`,
      python: `class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        res = [0] * len(temperatures)\n        st = []\n        for i, t in enumerate(temperatures):\n            while st and t > temperatures[st[-1]]:\n                idx = st.pop()\n                res[idx] = i - idx\n            st.append(i)\n        return res\n`
    }
  },
  {
    id: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    section: "Stacks & Queues",
    topic: ["queue", "deque", "monotonic-queue", "queue-deque"],
    company_tags: ["amazon", "google", "meta"],
    pattern_tags: ["monotonic-queue", "queue-deque"],
    acceptance_rate: 46,
    description: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. Return the max sliding window.",
    examples: [{ input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" }],
    testcases: [
      { input: "[1,3,-1,-3,5,3,6,7]\n3", expectedOutput: "[3,3,5,5,6,7]" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        deque<int> dq;\n        vector<int> res;\n        for (int i = 0; i < nums.size(); i++) {\n            if (!dq.empty() && dq.front() == i - k) dq.pop_front();\n            while (!dq.empty() && nums[dq.back()] < nums[i]) dq.pop_back();\n            dq.push_back(i);\n            if (i >= k - 1) res.push_back(nums[dq.front()]);\n        }\n        return res;\n    }\n};`,
      java: `class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        Deque<Integer> dq = new ArrayDeque<>();\n        int[] res = new int[nums.length - k + 1];\n        int idx = 0;\n        for (int i = 0; i < nums.length; i++) {\n            if (!dq.isEmpty() && dq.peekFirst() == i - k) dq.pollFirst();\n            while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();\n            dq.addLast(i);\n            if (i >= k - 1) res[idx++] = nums[dq.peekFirst()];\n        }\n        return res;\n    }\n}`,
      python: `class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        dq = collections.deque()\n        res = []\n        for i, n in enumerate(nums):\n            if dq and dq[0] == i - k: dq.popleft()\n            while dq and nums[dq[-1]] < n: dq.pop()\n            dq.append(i)\n            if i >= k - 1: res.append(nums[dq[0]])\n        return res\n`
    }
  },
  {
    id: "subsets",
    title: "Subsets",
    difficulty: "Medium",
    section: "Backtracking & Subsets",
    topic: ["backtracking", "subsets", "backtracking-patterns"],
    company_tags: ["meta", "amazon", "google"],
    pattern_tags: ["backtracking", "backtracking-patterns"],
    acceptance_rate: 76,
    description: "Given an integer array nums of unique elements, return all possible subsets (the power set).",
    examples: [{ input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }],
    testcases: [
      { input: "[1,2,3]", expectedOutput: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        vector<vector<int>> res;\n        vector<int> curr;\n        backtrack(nums, 0, curr, res);\n        return res;\n    }\n    void backtrack(vector<int>& nums, int start, vector<int>& curr, vector<vector<int>>& res) {\n        res.push_back(curr);\n        for (int i = start; i < nums.size(); i++) {\n            curr.push_back(nums[i]);\n            backtrack(nums, i + 1, curr, res);\n            curr.pop_back();\n        }\n    }\n};`,
      java: `class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        List<List<Integer>> res = new ArrayList<>();\n        backtrack(nums, 0, new ArrayList<>(), res);\n        return res;\n    }\n    private void backtrack(int[] nums, int start, List<Integer> curr, List<List<Integer>> res) {\n        res.add(new ArrayList<>(curr));\n        for (int i = start; i < nums.length; i++) {\n            curr.add(nums[i]);\n            backtrack(nums, i + 1, curr, res);\n            curr.remove(curr.size() - 1);\n        }\n    }\n}`,
      python: `class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        res = []\n        def backtrack(start, curr):\n            res.append(list(curr))\n            for i in range(start, len(nums)):\n                curr.append(nums[i])\n                backtrack(i + 1, curr)\n                curr.pop()\n        backtrack(0, [])\n        return res\n`
    }
  },
  {
    id: "implement-trie-prefix-tree",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    section: "Advanced Data Structures",
    topic: ["trie", "prefix-tree", "trie-patterns"],
    company_tags: ["google", "amazon", "microsoft"],
    pattern_tags: ["trie", "trie-patterns"],
    acceptance_rate: 62,
    description: "A trie (pronounced as 'try') or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement the Trie class.",
    examples: [{ input: "Trie trie = new Trie(); trie.insert(\"apple\"); trie.search(\"apple\");", output: "true" }],
    testcases: [
      { input: "[\"Trie\",\"insert\",\"search\"]\n[[],[\"apple\"],[\"apple\"]]", expectedOutput: "[null,null,true]" }
    ],
    starter_code: {
      cpp: `class Trie {\npublic:\n    Trie() {}\n    void insert(string word) {}\n    bool search(string word) { return false; }\n    bool startsWith(string prefix) { return false; }\n};`,
      java: `class Trie {\n    public Trie() {}\n    public void insert(String word) {}\n    public boolean search(String word) { return false; }\n    public boolean startsWith(String prefix) { return false; }\n}`,
      python: `class Trie:\n    def __init__(self):\n        pass\n    def insert(self, word: str) -> None:\n        pass\n    def search(self, word: str) -> bool:\n        return False\n    def startsWith(self, prefix: str) -> bool:\n        return False\n`
    }
  },
  {
    id: "range-sum-query-mutable",
    title: "Range Sum Query - Mutable",
    difficulty: "Medium",
    section: "Advanced Trees",
    topic: ["segment-tree", "fenwick-tree", "segment-fenwick"],
    company_tags: ["google", "amazon", "adobe"],
    pattern_tags: ["segment-fenwick", "segment-tree"],
    acceptance_rate: 40,
    description: "Given an integer array nums, handle multiple queries of calculating the sum of elements between indices left and right, and updating single elements.",
    examples: [{ input: "NumArray numArray = new NumArray([1, 3, 5]); numArray.sumRange(0, 2);", output: "9" }],
    testcases: [
      { input: "[1,3,5]\nsumRange(0,2)", expectedOutput: "9" }
    ],
    starter_code: {
      cpp: `class NumArray {\npublic:\n    NumArray(vector<int>& nums) {}\n    void update(int index, int val) {}\n    int sumRange(int left, int right) { return 0; }\n};`,
      java: `class NumArray {\n    public NumArray(int[] nums) {}\n    public void update(int index, int val) {}\n    public int sumRange(int left, int right) { return 0; }\n}`,
      python: `class NumArray:\n    def __init__(self, nums: List[int]):\n        pass\n    def update(self, index: int, val: int) -> None:\n        pass\n    def sumRange(self, left: int, right: int) -> int:\n        return 0\n`
    }
  },
  {
    id: "redundant-connection",
    title: "Redundant Connection",
    difficulty: "Medium",
    section: "Graph & Graph Grid",
    topic: ["union-find", "disjoint-set", "graph"],
    company_tags: ["google", "amazon", "meta"],
    pattern_tags: ["union-find"],
    acceptance_rate: 63,
    description: "In this problem, a tree is an undirected graph that is connected and has no cycles. Return an edge that can be removed so that the resulting graph is a tree of n nodes.",
    examples: [{ input: "edges = [[1,2],[1,3],[2,3]]", output: "[2,3]" }],
    testcases: [
      { input: "[[1,2],[1,3],[2,3]]", expectedOutput: "[2,3]" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<int> findRedundantConnection(vector<vector<int>>& edges) {\n        int n = edges.size();\n        vector<int> parent(n + 1);\n        for (int i = 1; i <= n; i++) parent[i] = i;\n        auto find = [&](auto& self, int i) -> int {\n            return parent[i] == i ? i : parent[i] = self(self, parent[i]);\n        };\n        for (auto& e : edges) {\n            int p1 = find(find, e[0]), p2 = find(find, e[1]);\n            if (p1 == p2) return e;\n            parent[p1] = p2;\n        }\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[] findRedundantConnection(int[][] edges) {\n        int n = edges.length;\n        int[] parent = new int[n + 1];\n        for (int i = 1; i <= n; i++) parent[i] = i;\n        for (int[] e : edges) {\n            int p1 = find(parent, e[0]), p2 = find(parent, e[1]);\n            if (p1 == p2) return e;\n            parent[p1] = p2;\n        }\n        return new int[0];\n    }\n    private int find(int[] parent, int i) {\n        return parent[i] == i ? i : (parent[i] = find(parent, parent[i]));\n    }\n}`,
      python: `class Solution:\n    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:\n        parent = list(range(len(edges) + 1))\n        def find(i):\n            if parent[i] == i: return i\n            parent[i] = find(parent[i])\n            return parent[i]\n        for u, v in edges:\n            pu, pv = find(u), find(v)\n            if pu == pv: return [u, v]\n            parent[pu] = pv\n        return []\n`
    }
  },
  {
    id: "max-points-on-a-line",
    title: "Max Points on a Line",
    difficulty: "Hard",
    section: "Computational Geometry",
    topic: ["geometry", "computational-geometry", "math"],
    company_tags: ["google", "amazon", "meta"],
    pattern_tags: ["computational-geometry", "geometry"],
    acceptance_rate: 26,
    description: "Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane, return the maximum number of points that lie on the same straight line.",
    examples: [{ input: "points = [[1,1],[2,2],[3,3]]", output: "3" }],
    testcases: [
      { input: "[[1,1],[2,2],[3,3]]", expectedOutput: "3" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int maxPoints(vector<vector<int>>& points) {\n        int n = points.size(); if (n <= 2) return n;\n        int ans = 0;\n        for (int i = 0; i < n; i++) {\n            unordered_map<string, int> mp;\n            for (int j = i + 1; j < n; j++) {\n                int dx = points[j][0] - points[i][0];\n                int dy = points[j][1] - points[i][1];\n                int g = std::__gcd(dx, dy);\n                string slope = to_string(dx / g) + "_" + to_string(dy / g);\n                mp[slope]++;\n                ans = max(ans, mp[slope] + 1);\n            }\n        }\n        return max(ans, 2);\n    }\n};`,
      java: `class Solution {\n    public int maxPoints(int[][] points) {\n        int n = points.length; if (n <= 2) return n;\n        int ans = 0;\n        for (int i = 0; i < n; i++) {\n            Map<String, Integer> map = new HashMap<>();\n            for (int j = i + 1; j < n; j++) {\n                int dx = points[j][0] - points[i][0];\n                int dy = points[j][1] - points[i][1];\n                int g = gcd(dx, dy);\n                String slope = (dx / g) + "_" + (dy / g);\n                map.put(slope, map.getOrDefault(slope, 0) + 1);\n                ans = Math.max(ans, map.get(slope) + 1);\n            }\n        }\n        return Math.max(ans, 2);\n    }\n    private int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }\n}`,
      python: `class Solution:\n    def maxPoints(self, points: List[List[int]]) -> int:\n        n = len(points)\n        if n <= 2: return n\n        ans = 0\n        for i in range(n):\n            slopes = collections.defaultdict(int)\n            for j in range(i + 1, n):\n                dx = points[j][0] - points[i][0]\n                dy = points[j][1] - points[i][1]\n                g = math.gcd(dx, dy)\n                slope = (dx // g, dy // g)\n                slopes[slope] += 1\n                ans = max(ans, slopes[slope] + 1)\n        return max(ans, 2)\n`
    }
  },
  {
    id: "lru-cache-design",
    title: "Design LRU Cache",
    difficulty: "Medium",
    section: "Design Patterns",
    topic: ["design", "lru-cache", "design-patterns-dsa"],
    company_tags: ["amazon", "google", "meta", "microsoft"],
    pattern_tags: ["design-patterns-dsa", "lru-cache"],
    acceptance_rate: 41,
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) time complexity for get and put operations.",
    examples: [{ input: "LRUCache lRUCache = new LRUCache(2); lRUCache.put(1, 1); lRUCache.get(1);", output: "1" }],
    testcases: [
      { input: "[\"LRUCache\",\"put\",\"get\"]\n[[2],[1,1],[1]]", expectedOutput: "[null,null,1]" }
    ],
    starter_code: {
      cpp: `class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};`,
      java: `class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}`,
      python: `class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        return -1\n    def put(self, key: int, value: int) -> None:\n        pass\n`
    }
  },
  {
    id: "subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    section: "Prefix Sum & Hash Map",
    topic: ["prefix-sum", "hashing", "arrays"],
    company_tags: ["meta", "amazon", "google"],
    pattern_tags: ["prefix-sum", "hashing"],
    acceptance_rate: 44,
    description: "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.",
    examples: [
      { input: "nums = [1,1,1], k = 2", output: "2" },
      { input: "nums = [1,2,3], k = 3", output: "2" }
    ],
    testcases: [
      { input: "[1,1,1]\n2", expectedOutput: "2" },
      { input: "[1,2,3]\n3", expectedOutput: "2" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        unordered_map<int, int> mp = {{0, 1}};\n        int sum = 0, count = 0;\n        for (int n : nums) {\n            sum += n;\n            if (mp.count(sum - k)) count += mp[sum - k];\n            mp[sum]++;\n        }\n        return count;\n    }\n};`,
      java: `class Solution {\n    public int subarraySum(int[] nums, int k) {\n        Map<Integer, Integer> map = new HashMap<>();\n        map.put(0, 1);\n        int sum = 0, count = 0;\n        for (int n : nums) {\n            sum += n;\n            if (map.containsKey(sum - k)) count += map.get(sum - k);\n            map.put(sum, map.getOrDefault(sum, 0) + 1);\n        }\n        return count;\n    }\n}`,
      python: `class Solution:\n    def subarraySum(self, nums: List[int], k: int) -> int:\n        mp = {0: 1}\n        s = 0\n        count = 0\n        for n in nums:\n            s += n\n            if s - k in mp:\n                count += mp[s - k]\n            mp[s] = mp.get(s, 0) + 1\n        return count\n`
    }
  },
  {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    section: "Binary Search",
    topic: ["binary-search", "arrays"],
    company_tags: ["amazon", "meta", "google", "microsoft"],
    pattern_tags: ["binary-search"],
    acceptance_rate: 39,
    description: "Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.",
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" }
    ],
    testcases: [
      { input: "[4,5,6,7,0,1,2]\n0", expectedOutput: "4" },
      { input: "[4,5,6,7,0,1,2]\n3", expectedOutput: "-1" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int l = 0, r = nums.size() - 1;\n        while (l <= r) {\n            int m = l + (r - l) / 2;\n            if (nums[m] == target) return m;\n            if (nums[l] <= nums[m]) {\n                if (nums[l] <= target && target < nums[m]) r = m - 1;\n                else l = m + 1;\n            } else {\n                if (nums[m] < target && target <= nums[r]) l = m + 1;\n                else r = m - 1;\n            }\n        }\n        return -1;\n    }\n};`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        int l = 0, r = nums.length - 1;\n        while (l <= r) {\n            int m = l + (r - l) / 2;\n            if (nums[m] == target) return m;\n            if (nums[l] <= nums[m]) {\n                if (nums[l] <= target && target < nums[m]) r = m - 1;\n                else l = m + 1;\n            } else {\n                if (nums[m] < target && target <= nums[r]) l = m + 1;\n                else r = m - 1;\n            }\n        }\n        return -1;\n    }\n}`,
      python: `class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        l, r = 0, len(nums) - 1\n        while l <= r:\n            m = (l + r) // 2\n            if nums[m] == target: return m\n            if nums[l] <= nums[m]:\n                if nums[l] <= target < nums[m]: r = m - 1\n                else: l = m + 1\n            else:\n                if nums[m] < target <= nums[r]: l = m + 1\n                else: r = m - 1\n        return -1\n`
    }
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    section: "Sorting & Intervals",
    topic: ["merge-intervals", "sorting", "arrays"],
    company_tags: ["google", "amazon", "meta"],
    pattern_tags: ["merge-intervals", "sorting"],
    acceptance_rate: 46,
    description: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" }
    ],
    testcases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        sort(intervals.begin(), intervals.end());\n        vector<vector<int>> res;\n        for (auto& interval : intervals) {\n            if (res.empty() || res.back()[1] < interval[0]) res.push_back(interval);\n            else res.back()[1] = max(res.back()[1], interval[1]);\n        }\n        return res;\n    }\n};`,
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        Arrays.sort(intervals, (a,b)->Integer.compare(a[0], b[0]));\n        List<int[]> res = new ArrayList<>();\n        for (int[] interval : intervals) {\n            if (res.isEmpty() || res.get(res.size() - 1)[1] < interval[0]) res.add(interval);\n            else res.get(res.size() - 1)[1] = Math.max(res.get(res.size() - 1)[1], interval[1]);\n        }\n        return res.toArray(new int[0][]);\n    }\n}`,
      python: `class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        intervals.sort(key=lambda x: x[0])\n        res = []\n        for interval in intervals:\n            if not res or res[-1][1] < interval[0]: res.append(interval)\n            else: res[-1][1] = max(res[-1][1], interval[1])\n        return res\n`
    }
  },
  {
    id: "single-number",
    title: "Single Number",
    difficulty: "Easy",
    section: "Bit Manipulation",
    topic: ["bit-manipulation", "arrays"],
    company_tags: ["amazon", "google", "tcs"],
    pattern_tags: ["bit-manipulation"],
    acceptance_rate: 71,
    description: "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.",
    examples: [
      { input: "nums = [4,1,2,1,2]", output: "4" },
      { input: "nums = [2,2,1]", output: "1" }
    ],
    testcases: [
      { input: "[4,1,2,1,2]", expectedOutput: "4" },
      { input: "[2,2,1]", expectedOutput: "1" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        int res = 0;\n        for (int n : nums) res ^= n;\n        return res;\n    }\n};`,
      java: `class Solution {\n    public int singleNumber(int[] nums) {\n        int res = 0;\n        for (int n : nums) res ^= n;\n        return res;\n    }\n}`,
      python: `class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        res = 0\n        for n in nums: res ^= n\n        return res\n`
    }
  },
  {
    id: "course-schedule-ii",
    title: "Course Schedule II",
    difficulty: "Medium",
    section: "Graph & Topological Sort",
    topic: ["topological-sort", "graph", "bfs", "dfs"],
    company_tags: ["amazon", "google", "meta"],
    pattern_tags: ["topological-sort", "graph"],
    acceptance_rate: 49,
    description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Return the ordering of courses you should take to finish all courses.",
    examples: [
      { input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", output: "[0,2,1,3]" },
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "[0,1]" }
    ],
    testcases: [
      { input: "4\n[[1,0],[2,0],[3,1],[3,2]]", expectedOutput: "[0,2,1,3]" },
      { input: "2\n[[1,0]]", expectedOutput: "[0,1]" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n        vector<int> inDegree(numCourses, 0);\n        vector<vector<int>> adj(numCourses);\n        for (auto& p : prerequisites) { adj[p[1]].push_back(p[0]); inDegree[p[0]]++; }\n        queue<int> q;\n        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.push(i);\n        vector<int> res;\n        while (!q.empty()) {\n            int curr = q.front(); q.pop(); res.push_back(curr);\n            for (int next : adj[curr]) if (--inDegree[next] == 0) q.push(next);\n        }\n        return res.size() == numCourses ? res : vector<int>();\n    }\n};`,
      java: `class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        int[] inDegree = new int[numCourses];\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());\n        for (int[] p : prerequisites) { adj.get(p[1]).add(p[0]); inDegree[p[0]]++; }\n        Queue<Integer> q = new LinkedList<>();\n        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.add(i);\n        int[] res = new int[numCourses]; int idx = 0;\n        while (!q.isEmpty()) {\n            int curr = q.poll(); res[idx++] = curr;\n            for (int next : adj.get(curr)) if (--inDegree[next] == 0) q.add(next);\n        }\n        return idx == numCourses ? res : new int[0];\n    }\n}`,
      python: `class Solution:\n    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:\n        inDegree = [0] * numCourses\n        adj = collections.defaultdict(list)\n        for dest, src in prerequisites:\n            adj[src].append(dest)\n            inDegree[dest] += 1\n        q = collections.deque([i for i in range(numCourses) if inDegree[i] == 0])\n        res = []\n        while q:\n            curr = q.popleft()\n            res.append(curr)\n            for nxt in adj[curr]:\n                inDegree[nxt] -= 1\n                if inDegree[nxt] == 0: q.append(nxt)\n        return res if len(res) == numCourses else []\n`
    }
  },
  {
    id: "network-delay-time",
    title: "Network Delay Time",
    difficulty: "Medium",
    section: "Shortest Path Algorithms",
    topic: ["shortest-path", "dijkstra", "graph"],
    company_tags: ["google", "amazon"],
    pattern_tags: ["shortest-path", "dijkstra"],
    acceptance_rate: 52,
    description: "You are given a network of n nodes, labeled from 1 to n. Return the minimum time it takes for all the n nodes to receive the signal.",
    examples: [
      { input: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", output: "2" },
      { input: "times = [[1,2,1]], n = 2, k = 1", output: "1" }
    ],
    testcases: [
      { input: "[[2,1,1],[2,3,1],[3,4,1]]\n4\n2", expectedOutput: "2" },
      { input: "[[1,2,1]]\n2\n1", expectedOutput: "1" }
    ],
    starter_code: {
      cpp: `class Solution {\npublic:\n    int networkDelayTime(vector<vector<int>>& times, int n, int k) {\n        vector<vector<pair<int,int>>> adj(n + 1);\n        for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});\n        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;\n        vector<int> dist(n + 1, 1e9);\n        dist[k] = 0; pq.push({0, k});\n        while (!pq.empty()) {\n            auto [d, u] = pq.top(); pq.pop();\n            if (d > dist[u]) continue;\n            for (auto& [v, w] : adj[u]) {\n                if (dist[u] + w < dist[v]) {\n                    dist[v] = dist[u] + w;\n                    pq.push({dist[v], v});\n                }\n            }\n        }\n        int maxD = 0;\n        for (int i = 1; i <= n; i++) {\n            if (dist[i] == 1e9) return -1;\n            maxD = max(maxD, dist[i]);\n        }\n        return maxD;\n    }\n};`,
      java: `class Solution {\n    public int networkDelayTime(int[][] times, int n, int k) {\n        List<List<int[]>> adj = new ArrayList<>();\n        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());\n        for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});\n        PriorityQueue<int[]> pq = new PriorityQueue<>((a,b)->a[0]-b[0]);\n        int[] dist = new int[n + 1]; Arrays.fill(dist, (int)1e9);\n        dist[k] = 0; pq.add(new int[]{0, k});\n        while (!pq.isEmpty()) {\n            int[] curr = pq.poll(); int d = curr[0], u = curr[1];\n            if (d > dist[u]) continue;\n            for (int[] nxt : adj.get(u)) {\n                int v = nxt[0], w = nxt[1];\n                if (dist[u] + w < dist[v]) {\n                    dist[v] = dist[u] + w;\n                    pq.add(new int[]{dist[v], v});\n                }\n            }\n        }\n        int maxD = 0;\n        for (int i = 1; i <= n; i++) {\n            if (dist[i] == (int)1e9) return -1;\n            maxD = Math.max(maxD, dist[i]);\n        }\n        return maxD;\n    }\n}`,
      python: `class Solution:\n    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:\n        adj = collections.defaultdict(list)\n        for u, v, w in times: adj[u].append((v, w))\n        pq = [(0, k)]\n        dist = {}\n        while pq:\n            d, u = heapq.heappop(pq)\n            if u not in dist:\n                dist[u] = d\n                for v, w in adj[u]:\n                    heapq.heappush(pq, (d + w, v))\n        return max(dist.values()) if len(dist) == n else -1\n`
    }
  }
];

export const codingQuestions = MOCK_QUESTIONS;

export function getQuestionById(id: string): CodingQuestion | undefined {
  if (!id) return undefined;
  return MOCK_QUESTIONS.find((q) => q.id === id || String(q.id).toLowerCase() === String(id).toLowerCase());
}

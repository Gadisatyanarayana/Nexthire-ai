import type { CompilerDiagnostic, SupportedLanguage } from "./types";

type ParsedInputEntry = {
  name: string;
  rawValue: string;
};

type InvocationPlan = {
  preludeLines: string[];
  args: string;
};

function escapeRegExp(value: string): string {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeOutput(value: string | null | undefined): string {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function splitTopLevel(input: string, delimiter: string): string[] {
  const parts: string[] = [];
  let buffer = "";
  let bracketDepth = 0;
  let braceDepth = 0;
  let parenDepth = 0;
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
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
      if (ch === "(") parenDepth++;
      if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);

      if (ch === delimiter && bracketDepth === 0 && braceDepth === 0 && parenDepth === 0) {
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

function parseInputEntries(input: string): ParsedInputEntry[] {
  const raw = String(input || "").trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const entries: ParsedInputEntry[] = [];

  for (const line of lines) {
    const pieces = splitTopLevel(line, ",");
    for (const piece of pieces) {
      const trimmed = piece.trim();
      if (!trimmed) continue;

      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const name = trimmed.slice(0, eq).trim();
        const rhs = trimmed.slice(eq + 1).trim();
        if (name && rhs) {
          entries.push({ name, rawValue: rhs });
          continue;
        }
      }

      entries.push({ name: "", rawValue: trimmed });
    }
  }

  return entries;
}

function parseTypeList(value: string | undefined): string[] {
  const raw = String(value || "").trim();
  if (!raw) return [];
  return splitTopLevel(raw, ",").map((part) => part.trim()).filter(Boolean);
}

function normalizeTypeName(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function normalizeValueTokens(raw: string): string[] {
  return String(raw || "")
    .replace(/[\[\]\{\}\(\)]/g, " ")
    .replace(/,/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());
}

function looksNumericSequence(raw: string): boolean {
  const tokens = normalizeValueTokens(raw);
  return tokens.length > 1 && tokens.every((token) => /^-?\d+(\.\d+)?$/.test(token));
}

function canonicalizeSequence(raw: string): string {
  const tokens = normalizeValueTokens(raw);
  return tokens.join(",");
}

function collapseValuesForType(values: string[], typeHints: string[]): string[] {
  if (values.length === 0 || typeHints.length !== 1) return values;
  const onlyType = normalizeTypeName(typeHints[0]);

  if (onlyType.includes("[][]") && values.length > 1) {
    const rows = values
      .map((line) => normalizeValueTokens(line))
      .filter((row) => row.length > 0)
      .map((row) => `[${row.join(",")}]`);
    if (rows.length > 0) return [`[${rows.join(",")}]`];
  }

  if (onlyType.includes("[]") && values.length > 1) {
    const merged = values.flatMap((line) => normalizeValueTokens(line));
    if (merged.length > 0) return [`[${merged.join(",")}]`];
  }

  return values;
}

function quoteIfString(raw: string): string {
  const value = raw.trim();
  if (!value) return '""';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value;
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  if (/^(true|false)$/i.test(value)) return value.toLowerCase();
  if (value.startsWith("[") || value.startsWith("{")) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function quoteAsStringLiteral(raw: string): string {
  const value = String(raw || "").trim();
  const unwrapped = ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ? value.slice(1, -1)
    : value;
  return `"${unwrapped.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function isQuotedStringLiteral(value: string): boolean {
  return (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
}

function isBooleanLiteral(value: string): boolean {
  return /^(true|false)$/i.test(value);
}

function isIntegerLiteral(value: string): boolean {
  return /^-?\d+$/.test(value);
}

function isDecimalLiteral(value: string): boolean {
  return /^-?\d+\.\d+$/.test(value);
}

function isSpaceSeparatedNumericList(raw: string): boolean {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 && parts.every((part) => /^-?\d+(\.\d+)?$/.test(part));
}

function normalizeRawValue(raw: string): string {
  const value = raw.trim();
  if (!value) return value;
  if (isSpaceSeparatedNumericList(value)) return `[${value.split(/\s+/).join(",")}]`;
  return value;
}

function inferJavaArrayType(value: string, typeHint?: string): string {
  const normalizedHint = normalizeTypeName(typeHint);
  if (normalizedHint) {
    if (normalizedHint.includes("[][]")) {
      if (normalizedHint.includes("string")) return "String[][]";
      if (normalizedHint.includes("boolean") || normalizedHint.includes("bool")) return "boolean[][]";
      if (normalizedHint.includes("double") || normalizedHint.includes("float")) return "double[][]";
      if (normalizedHint.includes("long")) return "long[][]";
      if (normalizedHint.includes("int")) return "int[][]";
    }
    if (normalizedHint.includes("[]")) {
      if (normalizedHint.includes("string")) return "String[]";
      if (normalizedHint.includes("boolean") || normalizedHint.includes("bool")) return "boolean[]";
      if (normalizedHint.includes("double") || normalizedHint.includes("float")) return "double[]";
      if (normalizedHint.includes("long")) return "long[]";
      if (normalizedHint.includes("int")) return "int[]";
    }
  }

  if (!value.startsWith("[")) return "int[]";

  if (value.startsWith("[[")) {
    const inner = value.slice(1, -1).trim();
    const rows = splitTopLevel(inner, ",").filter(Boolean);
    if (rows.length === 0) return "int[][]";

    const rowTypes = rows.map((row) => inferJavaType(row, undefined));
    if (rowTypes.every((type) => type === "String[]")) return "String[][]";
    if (rowTypes.every((type) => type === "boolean[]")) return "boolean[][]";
    if (rowTypes.every((type) => type === "int[]")) return "int[][]";
    if (rowTypes.every((type) => type === "double[]" || type === "int[]")) return "double[][]";
    return "int[][]";
  }

  const inner = value.slice(1, -1).trim();
  if (!inner) return "int[]";

  const items = splitTopLevel(inner, ",").filter(Boolean);
  const itemTypes = items.map((item) => inferJavaType(item, undefined));

  if (itemTypes.every((type) => type === "int")) return "int[]";
  if (itemTypes.every((type) => type === "int" || type === "double")) return "double[]";
  if (itemTypes.every((type) => type === "boolean")) return "boolean[]";
  if (itemTypes.every((type) => type === "String")) return "String[]";
  return "String[]";
}

function extractParamName(paramDecl: string | undefined, index: number): string {
  const cleaned = String(paramDecl || "")
    .trim()
    .replace(/=.*/, "")
    .replace(/\b(final|const)\b/g, "")
    .trim();

  const match = cleaned.match(/([A-Za-z_]\w*)\s*(?:\[\s*\])?\s*(?:[&*])?\s*$/);
  const candidate = match?.[1]?.trim();
  if (candidate && !["int", "long", "double", "float", "boolean", "bool", "string", "char"].includes(candidate.toLowerCase())) {
    return candidate;
  }

  return `arg${index}`;
}

function inferJavaType(rawValue: string, typeHint?: string): string {
  const value = normalizeRawValue(rawValue);
  const normalizedHint = normalizeTypeName(typeHint);

  if (value.startsWith("[")) {
    return inferJavaArrayType(value, typeHint);
  }

  if (isBooleanLiteral(value)) return "boolean";
  if (isIntegerLiteral(value)) return "int";
  if (isDecimalLiteral(value)) return "double";
  if (isQuotedStringLiteral(value)) return "String";

  if (normalizedHint.includes("string") || normalizedHint.includes("str")) return "String";
  if (normalizedHint.includes("boolean") || normalizedHint.includes("bool")) return "boolean";
  if (normalizedHint.includes("double") || normalizedHint.includes("float")) return "double";
  if (normalizedHint.includes("long")) return "long";
  if (normalizedHint.includes("int")) return "int";
  return "String";
}

function inferJavaInitializer(rawValue: string, typeHint?: string): string {
  const value = normalizeRawValue(rawValue);
  const inferredType = inferJavaType(value, typeHint);

  if (inferredType.endsWith("[]")) {
    return `new ${inferredType}${value.replace(/\[/g, "{").replace(/\]/g, "}")}`;
  }

  if (inferredType === "boolean") return isBooleanLiteral(value) ? value.toLowerCase() : "false";
  if (inferredType === "double") {
    const num = Number(value);
    return Number.isFinite(num) ? String(num) : "0.0";
  }
  if (inferredType === "long") {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.floor(num)) : "0";
  }
  if (inferredType === "int") {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.floor(num)) : "0";
  }

  if (inferredType === "String") {
    return quoteAsStringLiteral(value);
  }

  return quoteIfString(value);
}

function inferCppType(rawValue: string, typeHint?: string): string {
  const normalizedHint = normalizeTypeName(typeHint);
  if (normalizedHint.includes("[][]")) {
    if (normalizedHint.includes("string")) return "vector<vector<string>>";
    if (normalizedHint.includes("bool")) return "vector<vector<bool>>";
    if (normalizedHint.includes("double") || normalizedHint.includes("float")) return "vector<vector<double>>";
    if (normalizedHint.includes("long")) return "vector<vector<long long>>";
    return "vector<vector<int>>";
  }

  if (normalizedHint.includes("[]")) {
    if (normalizedHint.includes("string")) return "vector<string>";
    if (normalizedHint.includes("bool")) return "vector<bool>";
    if (normalizedHint.includes("double") || normalizedHint.includes("float")) return "vector<double>";
    if (normalizedHint.includes("long")) return "vector<long long>";
    return "vector<int>";
  }

  if (normalizedHint.includes("string") || normalizedHint.includes("str")) return "string";
  if (normalizedHint.includes("bool")) return "bool";
  if (normalizedHint.includes("double") || normalizedHint.includes("float")) return "double";
  if (normalizedHint.includes("long")) return "long long";
  if (normalizedHint.includes("int")) return "int";

  const value = normalizeRawValue(rawValue);
  if (value.startsWith("[[")) return "vector<vector<int>>";
  if (value.startsWith("[")) return "vector<int>";
  if (/^(true|false)$/i.test(value)) return "bool";
  if (/^-?\d+$/.test(value)) return "int";
  if (/^-?\d+\.\d+$/.test(value)) return "double";
  return "string";
}

function inferCppInitializer(rawValue: string, typeHint?: string): string {
  const value = normalizeRawValue(rawValue);
  const inferredType = inferCppType(value, typeHint);

  if (inferredType.startsWith("vector")) {
    return value.replace(/\[/g, "{").replace(/\]/g, "}");
  }

  if (inferredType === "bool") return /^(true|false)$/i.test(value) ? value.toLowerCase() : "false";
  if (inferredType === "double") {
    const num = Number(value);
    return Number.isFinite(num) ? String(num) : "0.0";
  }
  if (inferredType === "long long") {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.floor(num)) : "0";
  }
  if (inferredType === "int") {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.floor(num)) : "0";
  }

  if (inferredType === "string") {
    return quoteAsStringLiteral(value);
  }

  return quoteIfString(value);
}

function normalizePythonLiteral(rawValue: string): string {
  const value = normalizeRawValue(rawValue);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value;
  if (value.startsWith("[") || value.startsWith("{") || value.startsWith("(")) {
    return value.replace(/\btrue\b/gi, "True").replace(/\bfalse\b/gi, "False");
  }
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true" ? "True" : "False";
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  return quoteIfString(value);
}

function normalizeJavascriptLiteral(rawValue: string): string {
  const value = normalizeRawValue(rawValue);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value;
  if (value.startsWith("[") || value.startsWith("{")) return value;
  if (/^(true|false)$/i.test(value)) return value.toLowerCase();
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  return quoteIfString(value);
}

function getArgumentEntries(input: string, typeHints: string[]): ParsedInputEntry[] {
  const entries = parseInputEntries(input);
  if (entries.length === 0) return [];

  if (typeHints.length === 1) {
    const collapsed = collapseValuesForType(entries.map((entry) => entry.rawValue), typeHints);
    if (collapsed.length === 1 && entries.length > 1) {
      const name = entries.find((entry) => entry.name)?.name || "";
      return [{ name, rawValue: collapsed[0] }];
    }
  }

  return entries;
}

function alignEntriesToParams(entries: ParsedInputEntry[], paramNames: string[]): ParsedInputEntry[] {
  if (entries.length === 0 || paramNames.length === 0) return entries;

  const normalizedNames = paramNames.map((name) => String(name || "").trim().toLowerCase()).filter(Boolean);
  if (normalizedNames.length === 0) return entries;

  const namedMap = new Map<string, ParsedInputEntry>();
  const unnamedQueue: ParsedInputEntry[] = [];

  for (const entry of entries) {
    const key = String(entry.name || "").trim().toLowerCase();
    if (key && !namedMap.has(key)) {
      namedMap.set(key, entry);
      continue;
    }
    unnamedQueue.push(entry);
  }

  if (namedMap.size === 0) return entries;

  const used = new Set<ParsedInputEntry>();
  const ordered: ParsedInputEntry[] = [];

  for (const paramName of normalizedNames) {
    const named = namedMap.get(paramName);
    if (named && !used.has(named)) {
      ordered.push(named);
      used.add(named);
      continue;
    }

    while (unnamedQueue.length > 0 && used.has(unnamedQueue[0])) {
      unnamedQueue.shift();
    }

    const nextUnnamed = unnamedQueue.shift();
    if (nextUnnamed) {
      ordered.push(nextUnnamed);
      used.add(nextUnnamed);
    }
  }

  for (const entry of entries) {
    if (!used.has(entry)) ordered.push(entry);
  }

  return ordered;
}

function parseJavaParams(code: string, functionName?: string): string[] {
  if (functionName && functionName.trim()) {
    const targetPattern = new RegExp(
      `class\\s+Solution[\\s\\S]*?\\b(?:public|private|protected)?\\s*(?:static\\s+)?[\\w<>\\[\\], ?]+\\s+${escapeRegExp(functionName.trim())}\\s*\\(([^)]*)\\)`,
      "m"
    );
    const targetMatch = code.match(targetPattern);
    if (targetMatch?.[1]?.trim()) {
      return splitTopLevel(targetMatch[1], ",").map((p) => p.trim()).filter(Boolean);
    }
  }

  const patterns = [
    /class\s+Solution[\s\S]*?\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+[A-Za-z_]\w*\s*\(([^)]*)\)/m,
    /class\s+Solution[\s\S]*?\(([^)]*)\)/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match?.[1]?.trim()) {
      return splitTopLevel(match[1], ",").map((p) => p.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseCppParams(code: string, functionName?: string): string[] {
  if (functionName && functionName.trim()) {
    const targetPattern = new RegExp(
      `class\\s+Solution[\\s\\S]*?\\b[A-Za-z_][\\w:<>,\\s*&]*\\s+${escapeRegExp(functionName.trim())}\\s*\\(([^)]*)\\)\\s*\\{`,
      "m"
    );
    const targetMatch = code.match(targetPattern);
    if (targetMatch?.[1]?.trim()) {
      return splitTopLevel(targetMatch[1], ",").map((p) => p.trim()).filter(Boolean);
    }
  }

  const patterns = [
    /class\s+Solution[\s\S]*?\b[A-Za-z_][\w:<>,\s*&]*\s+[A-Za-z_]\w*\s*\(([^)]*)\)\s*\{/m,
    /class\s+Solution[\s\S]*?\(([^)]*)\)\s*\{/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match?.[1]?.trim()) {
      return splitTopLevel(match[1], ",").map((p) => p.trim()).filter(Boolean);
    }
  }
  return [];
}

function parsePythonParams(code: string, functionName?: string): string[] {
  const classMatch = code.match(/class\s+Solution\b[\s\S]*/m);
  if (!classMatch) return [];

  const classBody = classMatch[0];
  if (functionName && functionName.trim()) {
    const targetPattern = new RegExp(`^\\s*def\\s+${escapeRegExp(functionName.trim())}\\s*\\(([^)]*)\\)\\s*:`, "m");
    const targetMatch = classBody.match(targetPattern);
    if (targetMatch?.[1]?.trim()) {
      return splitTopLevel(targetMatch[1], ",")
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((name) => name !== "self")
        .map((name) => String(name).replace(/=.*/, "").trim());
    }
  }

  const methodPattern = /^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:/gm;
  const methods: Array<{ name: string; params: string }> = [];
  let match: RegExpExecArray | null = methodPattern.exec(classBody);

  while (match) {
    methods.push({ name: match[1], params: match[2] || "" });
    match = methodPattern.exec(classBody);
  }

  if (methods.length === 0) return [];

  const selected = methods.find((method) => !/^__.*__$/.test(method.name) && !method.name.startsWith("_"))
    || methods.find((method) => method.name !== "__init__")
    || methods[0];

  return splitTopLevel(selected.params, ",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((name) => name !== "self")
    .map((name) => String(name).replace(/=.*/, "").trim());
}

function parseJavascriptParams(code: string, functionName?: string): string[] {
  if (functionName && functionName.trim()) {
    const targetPattern = new RegExp(
      `class\\s+Solution[\\s\\S]*?\\b(?:async\\s+)?${escapeRegExp(functionName.trim())}\\s*\\(([^)]*)\\)\\s*\\{`,
      "m"
    );
    const targetMatch = code.match(targetPattern);
    if (targetMatch?.[1]?.trim()) {
      return splitTopLevel(targetMatch[1], ",")
        .map((value) => value.trim().replace(/=.*/, ""))
        .filter(Boolean);
    }
  }

  const patterns = [
    /class\s+Solution[\s\S]*?\b[A-Za-z_]\w*\s*\(([^)]*)\)\s*\{/m,
    /class\s+Solution[\s\S]*?\(([^)]*)\)\s*\{/m,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match?.[1]?.trim()) {
      return splitTopLevel(match[1], ",")
        .map((value) => value.trim().replace(/=.*/, ""))
        .filter(Boolean);
    }
  }

  return [];
}

export function safeJsonParse(raw: string): any {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    if (!trimmed.startsWith("[") && !trimmed.startsWith("{") && !trimmed.startsWith('"') && !trimmed.startsWith("'")) {
      return trimmed;
    }
    try {
      const unwrapped = (trimmed.startsWith("'") && trimmed.endsWith("'")) ? trimmed.slice(1, -1) : trimmed;
      return JSON.parse(`"${unwrapped.replace(/"/g, '\\"')}"`);
    } catch {
      return trimmed;
    }
  }
}

export function extractJavaType(paramDecl: string): string {
  let cleaned = String(paramDecl || "")
    .trim()
    .replace(/=.*/, "")
    .replace(/\b(final)\b/g, "")
    .trim();
  cleaned = cleaned.replace(/@\w+\s+/g, "");
  const match = cleaned.match(/([\w<>\s,?[\]]+?)\s*([A-Za-z_]\w*)\s*$/);
  if (match) {
    let typePart = match[1].trim();
    const cArrayMatch = cleaned.match(/([A-Za-z_]\w*)\s*(\[.*\])\s*$/);
    if (cArrayMatch) {
      typePart = typePart + cArrayMatch[2];
    }
    return typePart.replace(/\s+/g, " ");
  }
  return cleaned;
}

export function resolveJavaType(typeHint: string): string {
  const type = extractJavaType(typeHint);
  if (type) return type;
  return typeHint.trim();
}

export function formatJavaValue(val: any, type: string): string {
  const cleanType = type.replace(/\s+/g, "");
  
  if (cleanType.startsWith("List<")) {
    const innerTypeMatch = type.match(/List\s*<\s*(.+)\s*>/);
    const innerType = innerTypeMatch ? innerTypeMatch[1].trim() : "Object";
    if (Array.isArray(val)) {
      const elements = val.map(item => formatJavaValue(item, innerType)).join(",");
      return `new ArrayList<>(Arrays.asList(${elements}))`;
    }
    return `new ArrayList<>()`;
  }
  
  if (cleanType.startsWith("Set<")) {
    const innerTypeMatch = type.match(/Set\s*<\s*(.+)\s*>/);
    const innerType = innerTypeMatch ? innerTypeMatch[1].trim() : "Object";
    if (Array.isArray(val)) {
      const elements = val.map(item => formatJavaValue(item, innerType)).join(",");
      return `new HashSet<>(Arrays.asList(${elements}))`;
    }
    return `new HashSet<>()`;
  }

  if (cleanType.endsWith("[]")) {
    const baseType = type.substring(0, type.lastIndexOf("[")).trim();
    if (Array.isArray(val)) {
      const elements = val.map(item => formatJavaValue(item, baseType)).join(",");
      return `new ${baseType}[]{${elements}}`;
    }
    return `new ${baseType}[]{}`;
  }

  if (cleanType === "int" || cleanType === "Integer") {
    const num = Math.floor(Number(val));
    return Number.isFinite(num) ? String(num) : "0";
  }
  if (cleanType === "long" || cleanType === "Long") {
    const num = Math.floor(Number(val));
    return (Number.isFinite(num) ? String(num) : "0") + "L";
  }
  if (cleanType === "double" || cleanType === "Double" || cleanType === "float" || cleanType === "Float") {
    const num = Number(val);
    return Number.isFinite(num) ? String(num) : "0.0";
  }
  if (cleanType === "boolean" || cleanType === "Boolean") {
    return String(val).toLowerCase() === "true" ? "true" : "false";
  }
  if (cleanType === "char" || cleanType === "Character") {
    const s = String(val);
    const charVal = s.length > 0 ? s[0] : ' ';
    if (charVal === "'") return "'\\''";
    if (charVal === "\\") return "'\\\\'";
    return `'${charVal}'`;
  }
  if (cleanType === "String") {
    return quoteAsStringLiteral(String(val));
  }

  return quoteIfString(String(val));
}

export function extractCppType(paramDecl: string): string {
  const cleaned = String(paramDecl || "")
    .trim()
    .replace(/=.*/, "")
    .replace(/\bconst\b/g, "")
    .replace(/&/g, "")
    .trim();
  const match = cleaned.match(/([\w:<>\s,?[\]*]+?)\s*([A-Za-z_]\w*)\s*$/);
  if (match) {
    return match[1].trim();
  }
  return cleaned;
}

export function formatCppValue(val: any, type: string): string {
  const cleanType = type.replace(/\s+/g, "");

  if (cleanType.startsWith("vector<")) {
    const innerTypeMatch = type.match(/vector\s*<\s*(.+)\s*>/);
    const innerType = innerTypeMatch ? innerTypeMatch[1].trim() : "int";
    if (Array.isArray(val)) {
      const elements = val.map(item => formatCppValue(item, innerType)).join(",");
      return `vector<${innerType}>{${elements}}`;
    }
    return `vector<${innerType}>{}`;
  }

  if (cleanType.startsWith("pair<")) {
    const innerTypesMatch = type.match(/pair\s*<\s*(.+)\s*>/);
    if (innerTypesMatch) {
      const parts = splitTopLevel(innerTypesMatch[1], ",");
      const typeA = parts[0]?.trim() || "int";
      const typeB = parts[1]?.trim() || "int";
      if (Array.isArray(val) && val.length >= 2) {
        return `pair<${typeA},${typeB}>{${formatCppValue(val[0], typeA)},${formatCppValue(val[1], typeB)}}`;
      }
    }
    return `pair<int,int>{}`;
  }

  if (cleanType.startsWith("tuple<")) {
    const innerTypesMatch = type.match(/tuple\s*<\s*(.+)\s*>/);
    if (innerTypesMatch) {
      const types = splitTopLevel(innerTypesMatch[1], ",").map(t => t.trim());
      if (Array.isArray(val)) {
        const elements = val.map((item, idx) => formatCppValue(item, types[idx] || "int")).join(",");
        return `tuple<${types.join(",")}>{${elements}}`;
      }
    }
    return `tuple<>{}`;
  }

  if (cleanType.startsWith("unordered_set<") || cleanType.startsWith("set<")) {
    const isUnordered = cleanType.startsWith("unordered_");
    const container = isUnordered ? "unordered_set" : "set";
    const innerTypeMatch = type.match(/(?:unordered_)?set\s*<\s*(.+)\s*>/);
    const innerType = innerTypeMatch ? innerTypeMatch[1].trim() : "int";
    if (Array.isArray(val)) {
      const elements = val.map(item => formatCppValue(item, innerType)).join(",");
      return `${container}<${innerType}>{${elements}}`;
    }
    return `${container}<${innerType}>{}`;
  }

  if (cleanType.startsWith("unordered_map<") || cleanType.startsWith("map<")) {
    const isUnordered = cleanType.startsWith("unordered_");
    const container = isUnordered ? "unordered_map" : "map";
    const innerTypesMatch = type.match(/(?:unordered_)?map\s*<\s*(.+)\s*>/);
    if (innerTypesMatch) {
      const parts = splitTopLevel(innerTypesMatch[1], ",");
      const keyType = parts[0]?.trim() || "int";
      const valType = parts[1]?.trim() || "int";
      if (typeof val === "object" && val !== null) {
        const entries = Object.entries(val).map(([k, v]) => {
          let parsedKey = k;
          try { parsedKey = JSON.parse(k); } catch {}
          return `{${formatCppValue(parsedKey, keyType)},${formatCppValue(v, valType)}}`;
        }).join(",");
        return `${container}<${keyType},${valType}>{${entries}}`;
      }
    }
    return `${container}<int,int>{}`;
  }

  if (cleanType === "int") {
    const num = Math.floor(Number(val));
    return Number.isFinite(num) ? String(num) : "0";
  }
  if (cleanType === "long" || cleanType === "longlong" || cleanType === "longlongint") {
    const num = Math.floor(Number(val));
    return (Number.isFinite(num) ? String(num) : "0") + "LL";
  }
  if (cleanType === "double" || cleanType === "float") {
    const num = Number(val);
    return Number.isFinite(num) ? String(num) : "0.0";
  }
  if (cleanType === "bool") {
    return String(val).toLowerCase() === "true" ? "true" : "false";
  }
  if (cleanType === "char") {
    const s = String(val);
    const charVal = s.length > 0 ? s[0] : ' ';
    if (charVal === "'") return "'\\''";
    if (charVal === "\\") return "'\\\\'";
    return `'${charVal}'`;
  }
  if (cleanType === "string") {
    return quoteAsStringLiteral(String(val));
  }

  return quoteIfString(String(val));
}

export function formatPythonValue(val: any): string {
  if (val === null || val === undefined) return "None";
  if (typeof val === "boolean") return val ? "True" : "False";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return quoteAsStringLiteral(val);
  if (Array.isArray(val)) {
    return "[" + val.map(item => formatPythonValue(item)).join(",") + "]";
  }
  if (typeof val === "object") {
    const entries = Object.entries(val).map(([k, v]) => `${formatPythonValue(k)}:${formatPythonValue(v)}`).join(",");
    return "{" + entries + "}";
  }
  return String(val);
}

export function buildJavaInvocationPlan(userCode: string, input: string, inputType?: string, functionName?: string): InvocationPlan {
  const declaredTypes = parseTypeList(inputType);
  const params = parseJavaParams(userCode, functionName);
  const entries = alignEntriesToParams(
    getArgumentEntries(input, declaredTypes),
    params.map((param, idx) => extractParamName(param, idx))
  );

  const preludeLines: string[] = [];
  const args = entries
    .map((entry, idx) => {
      const paramDecl = params[idx] || "";
      const name = entry.name || extractParamName(paramDecl, idx);
      const typeHint = paramDecl || declaredTypes[idx] || "";
      const variableType = resolveJavaType(typeHint);
      const parsedVal = safeJsonParse(entry.rawValue);
      const initializer = formatJavaValue(parsedVal, variableType);
      preludeLines.push(`        ${variableType} ${name} = ${initializer};`);
      return name;
    })
    .join(", ");

  return { preludeLines, args };
}

export function buildCppInvocationPlan(userCode: string, input: string, inputType?: string, functionName?: string): InvocationPlan {
  const declaredTypes = parseTypeList(inputType);
  const params = parseCppParams(userCode, functionName);
  const argPreparations: string[] = [];
  const entries = alignEntriesToParams(
    getArgumentEntries(input, declaredTypes),
    params.map((param, idx) => extractParamName(param, idx))
  );

  const argNames = entries.map((entry, idx) => {
    const paramDecl = params[idx] || "";
    const declaredType = paramDecl || declaredTypes[idx] || "";
    const argName = entry.name || extractParamName(paramDecl, idx);
    const cppType = extractCppType(declaredType);
    const parsedVal = safeJsonParse(entry.rawValue);
    const argValue = formatCppValue(parsedVal, cppType);
    argPreparations.push(`    ${cppType} ${argName} = ${argValue};`);
    return argName;
  });

  return {
    preludeLines: argPreparations,
    args: argNames.join(", "),
  };
}

export function buildPythonInvocationPlan(userCode: string, input: string, inputType?: string, functionName?: string): InvocationPlan {
  const declaredTypes = parseTypeList(inputType);
  const entries = alignEntriesToParams(getArgumentEntries(input, declaredTypes), parsePythonParams(userCode, functionName));
  const preludeLines: string[] = [];
  const args = entries
    .map((entry, idx) => {
      const rawName = entry.name || extractParamName(undefined, idx);
      const paramName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(rawName) ? rawName : `arg${idx + 1}`;
      const parsedVal = safeJsonParse(entry.rawValue);
      const value = formatPythonValue(parsedVal);
      preludeLines.push(`        ${paramName} = ${value}`);
      return paramName;
    })
    .join(", ");

  return { preludeLines, args };
}

export function buildJavascriptInvocationPlan(userCode: string, input: string, inputType?: string, functionName?: string): InvocationPlan {
  const declaredTypes = parseTypeList(inputType);
  const entries = alignEntriesToParams(getArgumentEntries(input, declaredTypes), parseJavascriptParams(userCode, functionName));
  const preludeLines: string[] = [];
  const args = entries
    .map((entry, idx) => {
      const paramName = entry.name || `arg${idx + 1}`;
      const parsedVal = safeJsonParse(entry.rawValue);
      const value = JSON.stringify(parsedVal);
      preludeLines.push(`const ${paramName} = ${value};`);
      return paramName;
    })
    .join(", ");

  return { preludeLines, args };
}

export function detectFunctionName(language: SupportedLanguage, code: string, hint?: string): string {
  if (hint && hint.trim()) {
    const selectedHint = hint.trim();
    const hintExists =
      (language === "java" && new RegExp(`class\\s+Solution[\\s\\S]*?\\b(?:public|private|protected)?\\s*(?:static\\s+)?[\\w<>\\[\\], ?]+\\s+${escapeRegExp(selectedHint)}\\s*\\(`, "m").test(code))
      || (language === "cpp" && new RegExp(`class\\s+Solution[\\s\\S]*?\\b[A-Za-z_][\\w:<>,\\s*&]*\\s+${escapeRegExp(selectedHint)}\\s*\\([^)]*\\)\\s*\\{`, "m").test(code))
      || (language === "javascript" && new RegExp(`class\\s+Solution[\\s\\S]*?\\b(?:async\\s+)?${escapeRegExp(selectedHint)}\\s*\\([^)]*\\)\\s*\\{`, "m").test(code))
      || (language === "python" && new RegExp(`^\\s*def\\s+${escapeRegExp(selectedHint)}\\s*\\([^)]*\\)\\s*:`, "m").test(code));

    if (hintExists) return selectedHint;
  }

  if (language === "java") {
    const match = code.match(/class\s+Solution[\s\S]*?\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+([A-Za-z_]\w*)\s*\(/m);
    return match?.[1] || "solve";
  }

  if (language === "cpp") {
    const match = code.match(/class\s+Solution[\s\S]*?\b[A-Za-z_][\w:<>,\s*&]*\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/m);
    return match?.[1] || "solve";
  }

  if (language === "javascript") {
    const classMatch = code.match(/class\s+Solution\b[\s\S]*/m);
    if (!classMatch) return "solve";

    const classBody = classMatch[0];
    const methodPattern = /^\s*(?:async\s+)?([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/gm;
    const methods: string[] = [];
    let match: RegExpExecArray | null = methodPattern.exec(classBody);

    while (match) {
      methods.push(match[1]);
      match = methodPattern.exec(classBody);
    }

    const selected = methods.find((name) => name !== "constructor" && !name.startsWith("_")) || methods[0];
    return selected || "solve";
  }

  const classMatch = code.match(/class\s+Solution\b[\s\S]*/m);
  if (!classMatch) return "solve";

  const classBody = classMatch[0];
  const methodPattern = /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm;
  const methods: string[] = [];
  let match: RegExpExecArray | null = methodPattern.exec(classBody);

  while (match) {
    methods.push(match[1]);
    match = methodPattern.exec(classBody);
  }

  const selected = methods.find((name) => !/^__.*__$/.test(name) && !name.startsWith("_"))
    || methods.find((name) => name !== "__init__")
    || methods[0];

  return selected || "solve";
}

export function hasUserDefinedMain(language: SupportedLanguage, code: string): boolean {
  if (language === "java") {
    return /\bpublic\s+static\s+void\s+main\s*\(/.test(code);
  }
  if (language === "cpp") {
    return /\bint\s+main\s*\(/.test(code);
  }
  if (language === "javascript") {
    return /require\.main\s*===\s*module|process\.argv/.test(code);
  }
  return /if\s+__name__\s*==\s*["']__main__["']\s*:/.test(code);
}

export function detectJavaVoidReturn(userCode: string, functionName: string): boolean {
  const escaped = escapeRegExp(functionName.trim());
  // Match: void functionName(...) — optionally preceded by public/private/protected/static
  const pattern = new RegExp(
    `class\\s+Solution[\\s\\S]*?\\b(?:public|private|protected)?\\s*(?:static\\s+)?void\\s+${escaped}\\s*\\(`,
    "m"
  );
  return pattern.test(userCode);
}

function buildJavaWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const params = parseJavaParams(userCode, functionName);
  const entries = alignEntriesToParams(
    getArgumentEntries(input, declaredTypes),
    params.map((param, idx) => extractParamName(param, idx))
  );

  const preludeLines: string[] = [];
  const argNames = entries.map((entry, idx) => {
    const paramDecl = params[idx] || "";
    const name = entry.name || extractParamName(paramDecl, idx);
    const typeHint = paramDecl || declaredTypes[idx] || "";
    const variableType = resolveJavaType(typeHint);
    const parsedVal = safeJsonParse(entry.rawValue);
    const initializer = formatJavaValue(parsedVal, variableType);
    preludeLines.push(`        ${variableType} ${name} = ${initializer};`);
    return name;
  });

  const args = argNames.join(", ");
  const isVoid = detectJavaVoidReturn(userCode, functionName);

  // For void methods (e.g. in-place sort), print the first argument after the call
  const callBlock = isVoid
    ? `        obj.${functionName}(${args});
        System.out.print(${argNames[0] != null ? `formatResult(${argNames[0]})` : '""'});`
    : `        Object result = obj.${functionName}(${args});
        System.out.print(formatResult(result));`;

  return `${userCode}

import java.util.*;

public class Main {
    @SuppressWarnings("unchecked")
    static String formatResult(Object value) {
        if (value == null) return "null";
        if (value instanceof Boolean) return value.toString();
        if (value instanceof int[]) {
            int[] arr = (int[]) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(arr[i]); }
            return sb.append("]").toString();
        }
        if (value instanceof long[]) {
            long[] arr = (long[]) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(arr[i]); }
            return sb.append("]").toString();
        }
        if (value instanceof double[]) {
            double[] arr = (double[]) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(arr[i]); }
            return sb.append("]").toString();
        }
        if (value instanceof boolean[]) {
            boolean[] arr = (boolean[]) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(arr[i]); }
            return sb.append("]").toString();
        }
        if (value instanceof char[]) {
            return new String((char[]) value);
        }
        if (value instanceof Object[]) {
            Object[] arr = (Object[]) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(formatResult(arr[i])); }
            return sb.append("]").toString();
        }
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) { if (i > 0) sb.append(","); sb.append(formatResult(list.get(i))); }
            return sb.append("]").toString();
        }
        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!first) sb.append(","); first = false;
                sb.append(formatResult(e.getKey())).append(":").append(formatResult(e.getValue()));
            }
            return sb.append("}").toString();
        }
        if (value instanceof Set) {
            Set<?> set = (Set<?>) value;
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : set) { if (!first) sb.append(","); first = false; sb.append(formatResult(item)); }
            return sb.append("]").toString();
        }
        return String.valueOf(value);
    }

    public static void main(String[] args) {
        Solution obj = new Solution();
${preludeLines.length > 0 ? `${preludeLines.join("\n")}\n` : ""}${callBlock}
    }
}
`;
}

export function detectCppVoidReturn(userCode: string, functionName: string): boolean {
  const escaped = escapeRegExp(functionName.trim());
  const pattern = new RegExp(
    `class\\s+Solution[\\s\\S]*?\\bvoid\\s+${escaped}\\s*\\(`,
    "m"
  );
  return pattern.test(userCode);
}

function buildCppWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const params = parseCppParams(userCode, functionName);
  const argPreparations: string[] = [];
  const entries = alignEntriesToParams(
    getArgumentEntries(input, declaredTypes),
    params.map((param, idx) => extractParamName(param, idx))
  );

  const argNames = entries.map((entry, idx) => {
    const paramDecl = params[idx] || "";
    const declaredType = paramDecl || declaredTypes[idx] || "";
    const argName = entry.name || extractParamName(paramDecl, idx);
    const cppType = extractCppType(declaredType);
    const parsedVal = safeJsonParse(entry.rawValue);
    const argValue = formatCppValue(parsedVal, cppType);
    argPreparations.push(`    ${cppType} ${argName} = ${argValue};`);
    return argName;
  });

  const args = argNames.join(", ");
  const prepBlock = argPreparations.length > 0 ? `${argPreparations.join("\n")}\n` : "";
  const isVoid = detectCppVoidReturn(userCode, functionName);

  const callBlock = isVoid
    ? `    obj.${functionName}(${args});
    printValue(${argNames[0] ?? "0"});`
    : `    auto result = obj.${functionName}(${args});
    printValue(result);`;

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

// ── Recursive formatValue overloads ──────────────────────────────────────
template<typename T>
std::string _fmtVal(const T& v);

inline std::string _fmtVal(int v)               { return std::to_string(v); }
inline std::string _fmtVal(long v)              { return std::to_string(v); }
inline std::string _fmtVal(long long v)         { return std::to_string(v); }
inline std::string _fmtVal(double v)            { std::ostringstream os; os << std::fixed << std::setprecision(6) << v; return os.str(); }
inline std::string _fmtVal(float v)             { return _fmtVal((double)v); }
inline std::string _fmtVal(bool v)              { return v ? "true" : "false"; }
inline std::string _fmtVal(const char* v)       { return std::string(v); }
inline std::string _fmtVal(const std::string& v){ return v; }

template<typename T>
std::string _fmtVal(const std::vector<T>& v) {
    std::string s = "[";
    for (size_t i = 0; i < v.size(); ++i) { if (i) s += ","; s += _fmtVal(v[i]); }
    return s + "]";
}

template<typename A, typename B>
std::string _fmtVal(const std::pair<A,B>& p) {
    return "[" + _fmtVal(p.first) + "," + _fmtVal(p.second) + "]";
}

template<typename K, typename V>
std::string _fmtVal(const std::map<K,V>& m) {
    std::string s = "{";
    bool first = true;
    for (auto& [k,v] : m) { if (!first) s += ","; first = false; s += _fmtVal(k) + ":" + _fmtVal(v); }
    return s + "}";
}

template<typename K, typename V>
std::string _fmtVal(const std::unordered_map<K,V>& m) {
    std::string s = "{";
    bool first = true;
    for (auto& [k,v] : m) { if (!first) s += ","; first = false; s += _fmtVal(k) + ":" + _fmtVal(v); }
    return s + "}";
}

template<typename T>
std::string _fmtVal(const std::set<T>& s) {
    std::string r = "[";
    bool first = true;
    for (auto& x : s) { if (!first) r += ","; first = false; r += _fmtVal(x); }
    return r + "]";
}

template<typename T>
std::string _fmtVal(const std::unordered_set<T>& s) {
    std::string r = "[";
    bool first = true;
    for (auto& x : s) { if (!first) r += ","; first = false; r += _fmtVal(x); }
    return r + "]";
}

template<typename... Ts, size_t... Is>
std::string _fmtTupleImpl(const std::tuple<Ts...>& t, std::index_sequence<Is...>) {
    std::string s = "[";
    ((s += (Is ? "," : "") + _fmtVal(std::get<Is>(t))), ...);
    return s + "]";
}
template<typename... Ts>
std::string _fmtVal(const std::tuple<Ts...>& t) {
    return _fmtTupleImpl(t, std::index_sequence_for<Ts...>{});
}

template<typename T>
void printValue(const T& v) { std::cout << _fmtVal(v); }

int main() {
    Solution obj;
${prepBlock}${callBlock}
    return 0;
}
`;
}

function detectPythonVoidReturn(userCode: string, functionName: string): boolean {
  // Python functions without explicit return or returning None are treated as void
  const escaped = escapeRegExp(functionName.trim());
  const classBodyMatch = userCode.match(/class\s+Solution[\s\S]*/m);
  if (!classBodyMatch) return false;
  const classBody = classBodyMatch[0];
  // Find the function body and check for a return statement with a non-None value
  const funcPattern = new RegExp(`def\\s+${escaped}\\s*\\([^)]*\\)\\s*(?:->\\s*[^:]+)?:([\\s\\S]*?)(?=\\n\\s{4}def|\\n\\s{0,3}[A-Za-z]|$)`, "m");
  const funcMatch = classBody.match(funcPattern);
  if (!funcMatch) return false;
  const body = funcMatch[1] || "";
  // If there's a return with a value (not None), it's not void
  if (/\breturn\s+(?!None\b)\S/.test(body)) return false;
  // If only `return` or `return None` or no return at all → void
  return true;
}

function buildPythonWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const entries = alignEntriesToParams(getArgumentEntries(input, declaredTypes), parsePythonParams(userCode, functionName));
  const preludeLines: string[] = [];
  const argNames = entries
    .map((entry, idx) => {
      const rawName = entry.name || extractParamName(undefined, idx);
      const paramName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(rawName) ? rawName : `arg${idx + 1}`;
      const parsedVal = safeJsonParse(entry.rawValue);
      const value = formatPythonValue(parsedVal);
      preludeLines.push(`        ${paramName} = ${value}`);
      return paramName;
    });

  const preparedArgsLiteral = `[${argNames.join(", ")}]`;
  const isVoid = detectPythonVoidReturn(userCode, functionName);

  // For void methods print the first argument after the call
  const printBlock = isVoid
    ? `        obj.${functionName}(*_prepared_args)
        print(_format_result(_prepared_args[0] if _prepared_args else None), end="")`
    : `        result = obj.${functionName}(*_prepared_args)
        print(_format_result(result), end="")`;

  return `${userCode}

import sys
import json

def _load_stdin_payload():
    raw = sys.stdin.read().strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return raw

def _format_result(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float):
        return f"{value:.6f}".rstrip('0').rstrip('.')
    if isinstance(value, list):
        return "[" + ",".join(_format_result(item) for item in value) + "]"
    if isinstance(value, tuple):
        return "[" + ",".join(_format_result(item) for item in value) + "]"
    if isinstance(value, dict):
        pairs = ",".join(_format_result(k) + ":" + _format_result(v) for k, v in value.items())
        return "{" + pairs + "}"
    if isinstance(value, set):
        return "[" + ",".join(_format_result(item) for item in sorted(value, key=str)) + "]"
    return str(value)

if __name__ == "__main__":
    try:
        obj = Solution()
${preludeLines.length > 0 ? `${preludeLines.join("\n")}\n` : ""}        _prepared_args = ${preparedArgsLiteral}
        if len(_prepared_args) > 0:
${printBlock}
        else:
            _stdin_payload = _load_stdin_payload()
            if _stdin_payload is None:
                result = obj.${functionName}()
            elif isinstance(_stdin_payload, list):
                result = obj.${functionName}(*_stdin_payload)
            elif isinstance(_stdin_payload, dict):
                result = obj.${functionName}(**_stdin_payload)
            else:
                result = obj.${functionName}(_stdin_payload)
            print(_format_result(result), end="")
    except Exception as exc:
        sys.stderr.write(f"ERROR: {exc}")
        raise
`;
}

function buildJavascriptWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const entries = alignEntriesToParams(getArgumentEntries(input, declaredTypes), parseJavascriptParams(userCode, functionName));
  const preludeLines: string[] = [];
  const args = entries
    .map((entry, idx) => {
      const paramName = entry.name || `arg${idx + 1}`;
      const value = normalizeJavascriptLiteral(entry.rawValue);
      preludeLines.push(`const ${paramName} = ${value};`);
      return paramName;
    })
    .join(", ");

  return `${userCode}

function _formatResult(value) {
  if (Array.isArray(value)) {
    return "[" + value.map((item) => _formatResult(item)).join(",") + "]";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === null || value === undefined) {
    return "null";
  }
  return String(value);
}

(() => {
  const obj = new Solution();
  ${preludeLines.join("\n  ")}
  const result = obj.${functionName}(${args});
  process.stdout.write(_formatResult(result));
})();
`;
}

export function buildWrappedCode(
  language: SupportedLanguage,
  userCode: string,
  functionName: string,
  input: string,
  inputType?: string
): string {
  if (language === "java") return buildJavaWrapper(userCode, functionName, input, inputType);
  if (language === "cpp") return buildCppWrapper(userCode, functionName, input, inputType);
  if (language === "javascript") return buildJavascriptWrapper(userCode, functionName, input, inputType);
  return buildPythonWrapper(userCode, functionName, input, inputType);
}

function parseStructuredValue(raw: string): any {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      const normalizedJson = trimmed
        .replace(/'/g, '"')
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null");
      return JSON.parse(normalizedJson);
    } catch {
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return Number(trimmed);
      }
      if (/^(true|false)$/i.test(trimmed)) {
        return trimmed.toLowerCase() === "true";
      }
      return trimmed;
    }
  }
}

function deepCompareValues(a: any, b: any, typeHint: string): boolean {
  if (typeof a === "number" && typeof b === "string") {
    b = Number(b);
  } else if (typeof b === "number" && typeof a === "string") {
    a = Number(a);
  }

  if (typeof a === "number" && typeof b === "number") {
    const isFloat = typeHint.includes("float") || typeHint.includes("double") || !Number.isInteger(a) || !Number.isInteger(b);
    if (isFloat) {
      return Math.abs(a - b) <= 1e-6;
    }
    return a === b;
  }

  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b;
  }

  if (typeof a === "string" && typeof b === "string") {
    return a.trim() === b.trim();
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    const isSet = typeHint.includes("set");
    if (isSet) {
      const bCopy = [...b];
      for (const itemA of a) {
        const idx = bCopy.findIndex((itemB) => deepCompareValues(itemA, itemB, typeHint));
        if (idx === -1) return false;
        bCopy.splice(idx, 1);
      }
      return true;
    }

    for (let i = 0; i < a.length; i++) {
      if (!deepCompareValues(a[i], b[i], typeHint)) return false;
    }
    return true;
  }

  if (a !== null && typeof a === "object" && b !== null && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!(key in b)) return false;
      if (!deepCompareValues(a[key], b[key], typeHint)) return false;
    }
    return true;
  }

  return String(a).trim() === String(b).trim();
}

function normalizeComparable(value: string): string {
  const text = normalizeOutput(value);
  const lower = text.toLowerCase();
  if (lower === "true" || lower === "false") return lower;

  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    return text.replace(/\s+/g, "");
  }

  return text;
}

function stripEnclosingQuotes(value: string): string {
  const text = String(value || "").trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}


export function compareWithOutputType(actual: string, expected: string, outputType?: string): boolean {
  const typeHint = normalizeTypeName(outputType);
  const normalizedActual = normalizeOutput(actual);
  const normalizedExpected = normalizeOutput(expected);

  if (!normalizedExpected) {
    return normalizeComparable(normalizedActual) === normalizeComparable(normalizedExpected);
  }

  const parsedActual = parseStructuredValue(normalizedActual);
  const parsedExpected = parseStructuredValue(normalizedExpected);

  return deepCompareValues(parsedActual, parsedExpected, typeHint);
}

export function parseJavaDiagnostics(raw: string, source: "compile" | "runtime"): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const lines = String(raw || "").split(/\r?\n/);
  const pattern = /^(?:[A-Za-z0-9_./\\-]+\.java):(\d+):(?:(\d+):)?\s*(error|warning|note):\s*(.+)$/i;

  for (const line of lines) {
    const m = line.match(pattern);
    if (!m) continue;
    diagnostics.push({
      line: Number(m[1] || 0),
      column: m[2] ? Number(m[2]) : undefined,
      severity: (m[3] || "error").toLowerCase() as "error" | "warning" | "note",
      message: String(m[4] || "").trim(),
      source,
    });
  }

  return diagnostics;
}

export function parseCppDiagnostics(raw: string, source: "compile" | "runtime"): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const lines = String(raw || "").split(/\r?\n/);
  const pattern = /^(?:[A-Za-z0-9_./\\-]+):(\d+):(\d+):\s*(fatal\s+error|error|warning|note):\s*(.+)$/i;

  for (const line of lines) {
    const m = line.match(pattern);
    if (!m) continue;
    const rawSeverity = String(m[3] || "error").toLowerCase();
    const severity: "error" | "warning" | "note" = rawSeverity.includes("warning")
      ? "warning"
      : rawSeverity.includes("note")
      ? "note"
      : "error";

    diagnostics.push({
      line: Number(m[1] || 0),
      column: Number(m[2] || 0),
      severity,
      message: String(m[4] || "").trim(),
      source,
    });
  }

  return diagnostics;
}

export function parsePythonDiagnostics(raw: string, source: "compile" | "runtime"): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const lines = String(raw || "").split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const fileMatch = lines[i].match(/^\s*File\s+"[^"]+",\s+line\s+(\d+)\s*$/);
    if (!fileMatch) continue;

    const lineNo = Number(fileMatch[1] || 0);
    let message = "";

    for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
      const candidate = String(lines[j] || "").trim();
      if (/^[A-Za-z_][A-Za-z0-9_]*Error:/.test(candidate) || /^[A-Za-z_][A-Za-z0-9_]*Exception:/.test(candidate)) {
        message = candidate;
      }
    }

    diagnostics.push({
      line: lineNo,
      severity: "error",
      message: message || "Python runtime/compile error near this line",
      source,
    });
  }

  return diagnostics;
}

export function parseJavascriptDiagnostics(raw: string, source: "compile" | "runtime"): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const lines = String(raw || "").split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/main\.js:(\d+)(?::(\d+))?/i);
    if (!match) continue;

    const nextLine = String(lines[i + 1] || "").trim();
    diagnostics.push({
      line: Number(match[1] || 1),
      column: match[2] ? Number(match[2]) : undefined,
      severity: "error",
      message: nextLine || String(lines[i] || "JavaScript runtime error"),
      source,
    });
  }

  return diagnostics;
}

export function parseDiagnostics(language: SupportedLanguage, raw: string, source: "compile" | "runtime"): CompilerDiagnostic[] {
  if (!raw.trim()) return [];
  let parsed: CompilerDiagnostic[] = [];
  if (language === "java") parsed = parseJavaDiagnostics(raw, source);
  else if (language === "cpp") parsed = parseCppDiagnostics(raw, source);
  else if (language === "javascript") parsed = parseJavascriptDiagnostics(raw, source);
  else parsed = parsePythonDiagnostics(raw, source);

  if (parsed.length === 0) {
    parsed.push({
      line: 0,
      severity: "error",
      message: raw.trim(),
      source,
    });
  }
  return parsed;
}

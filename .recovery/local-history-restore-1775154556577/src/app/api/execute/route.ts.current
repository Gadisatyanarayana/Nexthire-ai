import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { LANGUAGE_TO_JUDGE0 } from '@/lib/codingQuestions';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

type ExecuteBody = {
  code: string;
  language: 'cpp' | 'java' | 'python';
  testcases?: Array<{ input: string; expectedOutput: string }>;
  submit?: boolean;
  functionName?: string;
  inputType?: string;
  outputType?: string;
};

function normalizeOutput(value: string | null | undefined): string {
  return (value || '').replace(/\r\n/g, '\n').trim();
}

function splitTopLevel(input: string, delimiter: string): string[] {
  const parts: string[] = [];
  let buffer = '';
  let bracketDepth = 0;
  let braceDepth = 0;
  let parenDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const prev = i > 0 ? input[i - 1] : '';

    if (ch === "'" && !inDoubleQuote && prev !== '\\') {
      inSingleQuote = !inSingleQuote;
      buffer += ch;
      continue;
    }

    if (ch === '"' && !inSingleQuote && prev !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      buffer += ch;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === '[') bracketDepth++;
      if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
      if (ch === '(') parenDepth++;
      if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);

      if (ch === delimiter && bracketDepth === 0 && braceDepth === 0 && parenDepth === 0) {
        const trimmed = buffer.trim();
        if (trimmed) parts.push(trimmed);
        buffer = '';
        continue;
      }
    }

    buffer += ch;
  }

  const trimmed = buffer.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

function parseInputValues(input: string): string[] {
  const raw = String(input || '').trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const values: string[] = [];

  for (const line of lines) {
    const pieces = splitTopLevel(line, ',');
    if (pieces.length === 1) {
      const eq = pieces[0].indexOf('=');
      if (eq >= 0) {
        const rhs = pieces[0].slice(eq + 1).trim();
        if (rhs) values.push(rhs);
      } else {
        values.push(pieces[0].trim());
      }
      continue;
    }

    for (const piece of pieces) {
      const eq = piece.indexOf('=');
      if (eq >= 0) {
        const rhs = piece.slice(eq + 1).trim();
        if (rhs) values.push(rhs);
      } else if (piece.trim()) {
        values.push(piece.trim());
      }
    }
  }

  return values;
}

function parseTypeList(value: string | undefined): string[] {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return splitTopLevel(raw, ',').map((part) => part.trim()).filter(Boolean);
}

function normalizeTypeName(value: string | undefined): string {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function normalizeValueTokens(raw: string): string[] {
  return String(raw || '')
    .replace(/[\[\]\{\}\(\)]/g, ' ')
    .replace(/,/g, ' ')
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
  return tokens.join(',');
}

function collapseValuesForType(values: string[], typeHints: string[]): string[] {
  if (values.length === 0 || typeHints.length !== 1) return values;
  const onlyType = normalizeTypeName(typeHints[0]);

  if (onlyType.includes('[][]') && values.length > 1) {
    const rows = values
      .map((line) => normalizeValueTokens(line))
      .filter((row) => row.length > 0)
      .map((row) => `[${row.join(',')}]`);
    if (rows.length > 0) return [`[${rows.join(',')}]`];
  }

  if (onlyType.includes('[]') && values.length > 1) {
    const merged = values.flatMap((line) => normalizeValueTokens(line));
    if (merged.length > 0) return [`[${merged.join(',')}]`];
  }

  return values;
}

function quoteIfString(raw: string): string {
  const value = raw.trim();
  if (!value) return '""';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value;
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  if (/^(true|false)$/i.test(value)) return value.toLowerCase();
  if (value.startsWith('[') || value.startsWith('{')) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function isSpaceSeparatedNumericList(raw: string): boolean {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 && parts.every((part) => /^-?\d+(\.\d+)?$/.test(part));
}

function normalizeRawValue(raw: string): string {
  const value = raw.trim();
  if (!value) return value;
  if (isSpaceSeparatedNumericList(value)) return `[${value.split(/\s+/).join(',')}]`;
  return value;
}

function parseJavaParams(code: string): string[] {
  const match = code.match(/class\s+Solution[\s\S]*?\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+[A-Za-z_]\w*\s*\(([^)]*)\)/m);
  if (!match?.[1]?.trim()) return [];
  return splitTopLevel(match[1], ',').map((p) => p.trim());
}

function parseCppParams(code: string): string[] {
  const match = code.match(/class\s+Solution[\s\S]*?\b[A-Za-z_][\w:<>,\s*&]*\s+[A-Za-z_]\w*\s*\(([^)]*)\)\s*\{/m);
  if (!match?.[1]?.trim()) return [];
  return splitTopLevel(match[1], ',').map((p) => p.trim());
}

function detectFunctionName(language: ExecuteBody['language'], code: string, hint?: string): string {
  if (hint && hint.trim()) return hint.trim();

  if (language === 'java') {
    const match = code.match(/class\s+Solution[\s\S]*?\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+([A-Za-z_]\w*)\s*\(/m);
    return match?.[1] || 'solve';
  }

  if (language === 'cpp') {
    const match = code.match(/class\s+Solution[\s\S]*?\b[A-Za-z_][\w:<>,\s*&]*\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/m);
    return match?.[1] || 'solve';
  }

  const match = code.match(/class\s+Solution[\s\S]*?^\s*def\s+([A-Za-z_]\w*)\s*\(/m);
  return match?.[1] || 'solve';
}

function detectFunctionNameFromCode(language: ExecuteBody['language'], code: string): string | null {
  if (language === 'java') {
    const match = code.match(/class\s+Solution[\s\S]*?\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+([A-Za-z_]\w*)\s*\(/m);
    return match?.[1] || null;
  }

  if (language === 'cpp') {
    const match = code.match(/class\s+Solution[\s\S]*?\b[A-Za-z_][\w:<>,\s*&]*\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/m);
    return match?.[1] || null;
  }

  const match = code.match(/class\s+Solution[\s\S]*?^\s*def\s+([A-Za-z_]\w*)\s*\(/m);
  return match?.[1] || null;
}

function extractFunctionCandidates(language: ExecuteBody['language'], code: string): string[] {
  const names = new Set<string>();

  if (language === 'python') {
    const re = /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) names.add(m[1]);
    return Array.from(names);
  }

  if (language === 'java') {
    const re = /\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\], ?]+\s+([A-Za-z_]\w*)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      const candidate = m[1];
      if (!['if', 'for', 'while', 'switch', 'catch'].includes(candidate)) names.add(candidate);
    }
    return Array.from(names);
  }

  const re = /\b[A-Za-z_][\w:<>,\s*&]*\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const candidate = m[1];
    if (!['if', 'for', 'while', 'switch', 'catch'].includes(candidate)) names.add(candidate);
  }
  return Array.from(names);
}

function hasUserDefinedMain(language: ExecuteBody['language'], code: string): boolean {
  if (language === 'java') {
    return /\bpublic\s+static\s+void\s+main\s*\(/.test(code);
  }
  if (language === 'cpp') {
    return /\bint\s+main\s*\(/.test(code);
  }
  return /if\s+__name__\s*==\s*["']__main__["']\s*:/.test(code);
}

function toJavaArg(rawInput: string, declaredType?: string, paramDecl?: string): string {
  const raw = normalizeRawValue(rawInput);
  const typeHint = (declaredType || paramDecl || '').toLowerCase();

  if (typeHint.includes('int[][]') && raw.startsWith('[')) return `new int[][]${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;
  if (typeHint.includes('long[][]') && raw.startsWith('[')) return `new long[][]${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;
  if (typeHint.includes('double[][]') && raw.startsWith('[')) return `new double[][]${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;
  if (typeHint.includes('int[]') && raw.startsWith('[')) return `new int[]${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;
  if (typeHint.includes('long[]') && raw.startsWith('[')) return `new long[]${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;
  if (typeHint.includes('double[]') && raw.startsWith('[')) return `new double[]${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;
  if (typeHint.includes('string')) return quoteIfString(raw);
  if (typeHint.includes('char') && !raw.startsWith("'")) return `'${raw.replace(/'/g, "\\'")}'`;
  if (/^(true|false)$/i.test(raw)) return raw.toLowerCase();
  return quoteIfString(raw);
}

function toCppArg(rawInput: string, declaredType?: string, paramDecl?: string): string {
  const raw = normalizeRawValue(rawInput);
  const typeHint = (declaredType || paramDecl || '').toLowerCase();

  if (typeHint.includes('vector') && raw.startsWith('[')) return raw.replace(/\[/g, '{').replace(/\]/g, '}');
  if (typeHint.includes('string')) return quoteIfString(raw);
  if (typeHint.includes('bool') && /^(true|false)$/i.test(raw)) return raw.toLowerCase();
  return quoteIfString(raw);
}

function toPythonArg(rawInput: string, declaredType?: string): string {
  const raw = normalizeRawValue(rawInput);
  const typeHint = (declaredType || '').toLowerCase();
  if (/^(true|false)$/i.test(raw)) return raw.toLowerCase() === 'true' ? 'True' : 'False';
  if (typeHint.includes('str') || typeHint.includes('string')) return quoteIfString(raw);
  return quoteIfString(raw);
}

function buildJavaWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const values = collapseValuesForType(parseInputValues(input), declaredTypes);
  const params = parseJavaParams(userCode);
  const args = values.map((value, idx) => toJavaArg(value, declaredTypes[idx], params[idx])).join(', ');

  return `${userCode}

public class Main {
    static String formatResult(Object value) {
        if (value == null) return "null";
        if (value instanceof int[]) return java.util.Arrays.toString((int[]) value).replace(" ", "");
        if (value instanceof long[]) return java.util.Arrays.toString((long[]) value).replace(" ", "");
        if (value instanceof double[]) return java.util.Arrays.toString((double[]) value).replace(" ", "");
        if (value instanceof boolean[]) return java.util.Arrays.toString((boolean[]) value).replace(" ", "").toLowerCase();
        if (value instanceof Object[]) return java.util.Arrays.deepToString((Object[]) value).replace(" ", "");
        return String.valueOf(value);
    }

    public static void main(String[] args) {
        Solution obj = new Solution();
        Object result = obj.${functionName}(${args});
        System.out.print(formatResult(result));
    }
}
`;
}

function buildCppWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const values = collapseValuesForType(parseInputValues(input), declaredTypes);
  const params = parseCppParams(userCode);
  const args = values.map((value, idx) => toCppArg(value, declaredTypes[idx], params[idx])).join(', ');

  return `${userCode}

using namespace std;

template <typename T>
void printValue(const T& value) {
    cout << value;
}

void printValue(const bool& value) {
    cout << (value ? "true" : "false");
}

template <typename T>
void printValue(const vector<T>& arr) {
    cout << "[";
    for (size_t i = 0; i < arr.size(); i++) {
        if (i) cout << ",";
        printValue(arr[i]);
    }
    cout << "]";
}

int main() {
    Solution obj;
    auto result = obj.${functionName}(${args});
    printValue(result);
    return 0;
}
`;
}

function buildPythonWrapper(userCode: string, functionName: string, input: string, inputType?: string): string {
  const declaredTypes = parseTypeList(inputType);
  const values = collapseValuesForType(parseInputValues(input), declaredTypes);
  const args = values.map((value, idx) => toPythonArg(value, declaredTypes[idx])).join(', ');

  return `${userCode}

def _format_result(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, list):
        return "[" + ",".join(_format_result(item) for item in value) + "]"
    return str(value)

if __name__ == "__main__":
    obj = Solution()
    result = obj.${functionName}(${args})
    print(_format_result(result), end="")
`;
}

function buildWrappedCode(
  language: ExecuteBody['language'],
  userCode: string,
  functionName: string,
  input: string,
  inputType?: string
): string {
  if (language === 'java') return buildJavaWrapper(userCode, functionName, input, inputType);
  if (language === 'cpp') return buildCppWrapper(userCode, functionName, input, inputType);
  return buildPythonWrapper(userCode, functionName, input, inputType);
}

function normalizeComparable(value: string): string {
  const text = normalizeOutput(value);
  const lower = text.toLowerCase();
  if (lower === 'true' || lower === 'false') return lower;

  if (
    (text.startsWith('[') && text.endsWith(']')) ||
    (text.startsWith('{') && text.endsWith('}'))
  ) {
    return text.replace(/\s+/g, '');
  }

  return text;
}

function compareWithOutputType(actual: string, expected: string, outputType?: string): boolean {
  const typeHint = normalizeTypeName(outputType);
  const normalizedActual = normalizeOutput(actual);
  const normalizedExpected = normalizeOutput(expected);

  if (!normalizedExpected) return normalizeComparable(normalizedActual) === normalizeComparable(normalizedExpected);

  if (typeHint.includes('bool')) {
    return normalizedActual.toLowerCase() === normalizedExpected.toLowerCase();
  }

  if (typeHint.includes('float') || typeHint.includes('double')) {
    const a = Number(normalizedActual);
    const b = Number(normalizedExpected);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return Math.abs(a - b) <= 1e-6;
    }
  }

  if (typeHint.includes('[]') || looksNumericSequence(normalizedActual) || looksNumericSequence(normalizedExpected)) {
    return canonicalizeSequence(normalizedActual) === canonicalizeSequence(normalizedExpected);
  }

  return normalizeComparable(normalizedActual) === normalizeComparable(normalizedExpected);
}

function mapJudgeStatus(statusDescription: string | undefined, compileOutput?: string, stderr?: string): 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compile Error' {
  if (compileOutput) return 'Compile Error';
  if (stderr) return 'Runtime Error';

  const normalized = String(statusDescription || '').toLowerCase();
  if (normalized.includes('compilation')) return 'Compile Error';
  if (normalized.includes('runtime') || normalized.includes('time limit') || normalized.includes('memory limit')) return 'Runtime Error';
  return 'Accepted';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `execute:${ip}`, limit: 40, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json(
        { error: `Too many execution requests. Try again in ${gate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const { code, language, testcases = [], submit = false, functionName, inputType, outputType } = (await req.json()) as ExecuteBody;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    if (hasUserDefinedMain(language, code)) {
      return NextResponse.json(
        {
          error: 'Do not add a main entrypoint. Write only the method inside class Solution.',
          suggestions: [
            'Remove main() / __main__ block from your submission.',
            'Keep only class Solution with the required function signature.',
          ],
        },
        { status: 400 }
      );
    }

    const languageId = LANGUAGE_TO_JUDGE0[language];
    if (!languageId) {
      return NextResponse.json({ error: 'Unsupported language selected.' }, { status: 400 });
    }

    if (!process.env.JUDGE0_BASE_URL) {
      return NextResponse.json(
        { error: 'Judge0 is not configured. Add JUDGE0_BASE_URL to environment variables.' },
        { status: 500 }
      );
    }

    const judge0ApiKey = process.env.JUDGE0_API_KEY?.trim();
    const judge0Host = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

    const effectiveCases = testcases.length > 0 ? testcases : [{ input: '', expectedOutput: '' }];
    const typedHints = parseTypeList(inputType);
    const firstCaseValues = parseInputValues(effectiveCases[0]?.input || '');
    const validationWarnings: string[] = [];

    const codeDetectedName = detectFunctionNameFromCode(language, code);
    const candidates = extractFunctionCandidates(language, code);
    if (!codeDetectedName) {
      return NextResponse.json(
        {
          error: 'No callable method found in class Solution. Please define one method inside Solution and try again.',
          suggestions: [
            'Keep your method inside class Solution.',
            'Example: class Solution { public int myMethod(...) { ... } }',
          ],
        },
        { status: 400 }
      );
    }

    if (functionName?.trim() && !candidates.includes(functionName.trim())) {
      return NextResponse.json(
        {
          error: `Expected function '${functionName.trim()}' was not found in your Solution code.`,
          detectedFunction: codeDetectedName,
          suggestions: [
            `Rename your method to '${functionName.trim()}', or`,
            `update function_name metadata to '${codeDetectedName}'.`,
          ],
        },
        { status: 400 }
      );
    }

    if (typedHints.length > 1 && firstCaseValues.length > 0 && typedHints.length !== firstCaseValues.length) {
      validationWarnings.push(
        `Input type expects ${typedHints.length} parameter(s) but first testcase parsed ${firstCaseValues.length} value(s).`
      );
    }

    const inferredFunctionName = detectFunctionName(language, code, functionName);
    const caseResults: Array<{ input: string; output: string; expectedOutput: string; status: string; passed: boolean; timeMs?: number; memoryKb?: number }> = [];
    const timingsMs: number[] = [];
    const memoryKbs: number[] = [];
    let finalStatus: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compile Error' = 'Accepted';

    for (const tc of effectiveCases) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // RapidAPI headers are optional; free Judge0 CE endpoint works without API key.
      if (judge0ApiKey) {
        headers['X-RapidAPI-Key'] = judge0ApiKey;
        headers['X-RapidAPI-Host'] = judge0Host;
      }

      const wrappedCode = buildWrappedCode(language, code, inferredFunctionName, tc.input || '', inputType);

      const judge0Response = await axios.post(
        `${process.env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: wrappedCode,
          language_id: languageId,
          stdin: '',
        },
        {
          headers,
          timeout: 15000,
        }
      );

      const { stdout, stderr, compile_output, status, time, memory } = judge0Response.data as {
        stdout?: string;
        stderr?: string;
        compile_output?: string;
        status?: { description?: string };
        time?: string | number;
        memory?: number;
      };

      const timeSecNum = Number(time);
      const timeMs = Number.isFinite(timeSecNum) ? Math.max(0, Math.round(timeSecNum * 1000)) : undefined;
      const memoryKb = typeof memory === 'number' && Number.isFinite(memory) ? Math.max(0, Math.round(memory)) : undefined;
      if (typeof timeMs === 'number') timingsMs.push(timeMs);
      if (typeof memoryKb === 'number') memoryKbs.push(memoryKb);

      const output = normalizeOutput(stdout || stderr || compile_output || '');
      const expected = normalizeOutput(tc.expectedOutput || '');
      const mappedStatus = mapJudgeStatus(status?.description, compile_output, stderr);

      if (mappedStatus === 'Compile Error' || mappedStatus === 'Runtime Error') {
        finalStatus = mappedStatus;
      }

      const passed =
        mappedStatus === 'Accepted'
          ? expected
            ? compareWithOutputType(output, expected, outputType)
            : Boolean(output || status?.description === 'Accepted')
          : false;

      if (mappedStatus === 'Accepted' && !passed && finalStatus === 'Accepted') {
        finalStatus = 'Wrong Answer';
      }

      caseResults.push({
        input: tc.input || '',
        output: output || 'No output',
        expectedOutput: tc.expectedOutput || '--',
        status: mappedStatus,
        passed,
        timeMs,
        memoryKb,
      });

      if (submit && (!passed || mappedStatus !== 'Accepted')) {
        break;
      }
    }

    const allPassed = caseResults.length > 0 && caseResults.every((r) => r.passed);
    const result = allPassed && finalStatus === 'Accepted' ? 'Accepted' : finalStatus;
    const avgTimeMs = timingsMs.length > 0 ? Math.round(timingsMs.reduce((s, x) => s + x, 0) / timingsMs.length) : null;
    const maxTimeMs = timingsMs.length > 0 ? Math.max(...timingsMs) : null;
    const avgMemoryKb = memoryKbs.length > 0 ? Math.round(memoryKbs.reduce((s, x) => s + x, 0) / memoryKbs.length) : null;
    const maxMemoryKb = memoryKbs.length > 0 ? Math.max(...memoryKbs) : null;

    return NextResponse.json({
      mode: submit ? 'submit' : 'run',
      result,
      functionName: inferredFunctionName,
      warnings: validationWarnings,
      cases: caseResults,
      test_results: caseResults,
      summary: {
        total: caseResults.length,
        passed: caseResults.filter((r) => r.passed).length,
        failed: caseResults.filter((r) => !r.passed).length,
      },
      executionStats: {
        avgTimeMs,
        maxTimeMs,
        avgMemoryKb,
        maxMemoryKb,
        measuredCases: Math.max(timingsMs.length, memoryKbs.length),
      },
    });
  } catch (error: unknown) {
    const message =
      axios.isAxiosError(error) && error.code === 'ECONNABORTED'
        ? 'Execution timed out. Please simplify the test case or retry.'
        : error instanceof Error
        ? error.message
        : 'Code execution failed';
    console.error('Execution error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

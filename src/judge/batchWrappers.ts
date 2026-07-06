import type { JudgeCase, SupportedLanguage } from "./types";
import {
  buildCppInvocationPlan,
  buildJavaInvocationPlan,
  buildJavascriptInvocationPlan,
  buildPythonInvocationPlan,
  detectCppVoidReturn,
  detectJavaVoidReturn,
} from "./wrappers";

function indentLines(lines: string[], indentation: string): string[] {
  return lines.map((line) => `${indentation}${line}`);
}

function buildJavaBatchWrapper(userCode: string, functionName: string, cases: JudgeCase[], inputType?: string): string {
  // Ensure standard utilities are available for the generated wrapper
  const importLine = 'import java.util.*;';
  const userCodeWithImport = userCode.includes(importLine) ? userCode : `${importLine}\n${userCode}`;
  const isVoid = detectJavaVoidReturn(userCodeWithImport, functionName);
  const casesCode = cases
    .map((testcase, caseIndex) => {
      const plan = buildJavaInvocationPlan(userCodeWithImport, testcase.input || "", inputType, functionName);
      const prelude = indentLines(plan.preludeLines, "            ");
      const args = plan.args;

      return `        {
${prelude.length > 0 ? `${prelude.join("\n")}\n` : ""}            long __caseStart = System.nanoTime();
              String __output = "";
              String __error = null;
              try {
                  ${
                    isVoid
                      ? `obj.${functionName}(${args});
                __output = "void";`
                      : `Object result = obj.${functionName}(${args});
                __output = formatResult(result);`
                  }
                } catch (Throwable throwable) {
                __error = throwable.getMessage();
                if (__error == null || __error.isEmpty()) {
                  __error = throwable.getClass().getSimpleName();
                }
              }
              long __caseTimeMs = (System.nanoTime() - __caseStart) / 1000000L;
              StringBuilder __line = new StringBuilder();
              __line.append('{');
              __line.append('"').append("index").append('"').append(':').append(${caseIndex});
              __line.append(',').append('"').append("output").append('"').append(':').append('"').append(escapeJson(__output)).append('"');
              if (__error == null) {
                __line.append(',').append('"').append("error").append('"').append(':').append("null");
              } else {
                __line.append(',').append('"').append("error").append('"').append(':').append('"').append(escapeJson(__error)).append('"');
              }
              __line.append(',').append('"').append("timeMs").append('"').append(':').append(__caseTimeMs);
              __line.append(',').append('"').append("memoryKb").append('"').append(':').append("null");
              __line.append('}');
              System.out.println(__line.toString());
          }`;
    })
    .join("\n");

  return `${userCodeWithImport}\n\npublic class Main {\n    static String formatResult(Object value) {\n        if (value == null) return "null";\n        if (value instanceof int[]) return java.util.Arrays.toString((int[]) value).replace(" ", "");\n        if (value instanceof long[]) return java.util.Arrays.toString((long[]) value).replace(" ", "");\n        if (value instanceof double[]) return java.util.Arrays.toString((double[]) value).replace(" ", "");\n        if (value instanceof boolean[]) return java.util.Arrays.toString((boolean[]) value).replace(" ", "").toLowerCase();\n        if (value instanceof Object[]) return java.util.Arrays.deepToString((Object[]) value).replace(" ", "");\n        return String.valueOf(value);\n    }\n\n    static String escapeJson(String value) {\n        if (value == null) return "";\n        StringBuilder escaped = new StringBuilder();\n        for (int i = 0; i < value.length(); i++) {\n            char ch = value.charAt(i);\n            int code = (int) ch;\n            if (code == 92) {\n                escaped.append((char) 92).append((char) 92);\n            } else if (code == 34) {\n                escaped.append((char) 92).append('"');\n            } else if (code == 10) {\n                escaped.append((char) 92).append('n');\n            } else if (code == 13) {\n                escaped.append((char) 92).append('r');\n            } else if (code == 9) {\n                escaped.append((char) 92).append('t');\n            } else {\n                escaped.append(ch);\n            }\n        }\n        return escaped.toString();\n    }\n\n    public static void main(String[] args) {\n        Solution obj = new Solution();\n${casesCode}\n    }\n}\n`;
}


function buildCppBatchWrapper(userCode: string, functionName: string, cases: JudgeCase[], inputType?: string): string {
  const isVoid = detectCppVoidReturn(userCode, functionName);
  const casesCode = cases
    .map((testcase, caseIndex) => {
      const plan = buildCppInvocationPlan(userCode, testcase.input || "", inputType, functionName);
      const prelude = indentLines(plan.preludeLines, "        ");
      const args = plan.args;

      return `    {
${prelude.length > 0 ? `${prelude.join("\n")}\n` : ""}        auto __caseStart = chrono::steady_clock::now();
        string __output;
        string __error;
        try {
            ${
              isVoid
                ? `obj.${functionName}(${args});
            __output = "void";`
                : `auto result = obj.${functionName}(${args});
            __output = formatValue(result);`
            }
        } catch (const exception& ex) {
            __error = ex.what();
        } catch (...) {
            __error = "Unknown runtime error";
        }
        auto __caseEnd = chrono::steady_clock::now();
        long long __caseTimeMs = chrono::duration_cast<chrono::milliseconds>(__caseEnd - __caseStart).count();
        cout << '{'
             << '"' << "index" << '"' << ':' << ${caseIndex}
             << ',' << '"' << "output" << '"' << ':' << '"' << escapeJson(__output) << '"'
             << ',' << '"' << "error" << '"' << ':';
        if (__error.empty()) {
            cout << "null";
        } else {
            cout << '"' << escapeJson(__error) << '"';
        }
        cout << ',' << '"' << "timeMs" << '"' << ':' << __caseTimeMs
             << ',' << '"' << "memoryKb" << '"' << ':' << "null"
             << '}' << std::endl;
    }`;
    })
    .join("\n");

  return `#include <chrono>
#include <exception>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

${userCode}

string escapeJson(const string& value) {
    string escaped;
    escaped.reserve(value.size() + 8);
    for (char ch : value) {
    int code = static_cast<unsigned char>(ch);
    if (code == 92) {
      escaped.push_back(static_cast<char>(92));
      escaped.push_back(static_cast<char>(92));
    } else if (code == 34) {
      escaped.push_back(static_cast<char>(92));
      escaped.push_back('"');
    } else if (code == 10) {
      escaped.push_back(static_cast<char>(92));
      escaped.push_back('n');
    } else if (code == 13) {
      escaped.push_back(static_cast<char>(92));
      escaped.push_back('r');
    } else if (code == 9) {
      escaped.push_back(static_cast<char>(92));
      escaped.push_back('t');
        } else {
      escaped.push_back(ch);
        }
    }
    return escaped;
}

string formatValue(const int& value) { return to_string(value); }
string formatValue(const long& value) { return to_string(value); }
string formatValue(const long long& value) { return to_string(value); }
string formatValue(const double& value) { ostringstream stream; stream << fixed << setprecision(6) << value; return stream.str(); }
string formatValue(const string& value) { return value; }
string formatValue(const bool& value) { return value ? "true" : "false"; }
string formatValue(const vector<int>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << value[i]; } stream << ']'; return stream.str(); }
string formatValue(const vector<long long>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << value[i]; } stream << ']'; return stream.str(); }
string formatValue(const vector<double>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << value[i]; } stream << ']'; return stream.str(); }
string formatValue(const vector<bool>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << (value[i] ? "true" : "false"); } stream << ']'; return stream.str(); }
string formatValue(const vector<string>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << '"' << value[i] << '"'; } stream << ']'; return stream.str(); }
string formatValue(const vector<vector<int>>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << formatValue(value[i]); } stream << ']'; return stream.str(); }
string formatValue(const vector<vector<string>>& value) { ostringstream stream; stream << '['; for (size_t i = 0; i < value.size(); ++i) { if (i) stream << ','; stream << formatValue(value[i]); } stream << ']'; return stream.str(); }

template <typename T>
string formatValue(const T& value) {
    ostringstream stream;
    stream << value;
    return stream.str();
}

int main() {
    Solution obj;
${casesCode}
    return 0;
}
`;
}

function buildPythonBatchWrapper(userCode: string, functionName: string, cases: JudgeCase[], inputType?: string): string {
  const casesCode = cases
    .map((testcase, caseIndex) => {
      const plan = buildPythonInvocationPlan(userCode, testcase.input || "", inputType, functionName);
      const prelude = plan.preludeLines;
      const args = plan.args;

      return `${prelude.length > 0 ? `${prelude.join("\n")}\n` : ""}        __case_start = time.perf_counter_ns()
        __output = ""
        __error = None
        try:
            __result = obj.${functionName}(${args})
            __output = _format_result(__result)
        except Exception as exc:
            __error = str(exc) or exc.__class__.__name__
        __case_time_ms = int((time.perf_counter_ns() - __case_start) / 1_000_000)
        print(json.dumps({"index": ${caseIndex}, "output": __output, "error": __error, "timeMs": __case_time_ms, "memoryKb": None}, separators=(",", ":")))`;
    })
    .join("\n");

  return `${userCode}

import sys
import json
import time

def _format_result(value):
  if isinstance(value, bool):
    return "true" if value else "false"
  if isinstance(value, list):
    return "[" + ",".join(_format_result(item) for item in value) + "]"
  if value is None:
    return "null"
  return str(value)

if __name__ == "__main__":
    try:
        obj = Solution()
${casesCode}
    except Exception as exc:
        sys.stderr.write(f"ERROR: {exc}")
        raise
`;
}

function buildJavascriptBatchWrapper(userCode: string, functionName: string, cases: JudgeCase[], inputType?: string): string {
  const casesCode = cases
    .map((testcase, caseIndex) => {
      const plan = buildJavascriptInvocationPlan(userCode, testcase.input || "", inputType, functionName);
      const prelude = indentLines(plan.preludeLines, "  ");
      const args = plan.args;

      return `  {
${prelude.length > 0 ? `${prelude.join("\n")}\n` : ""}    const __caseStart = Date.now();
    let __output = "";
    let __error = null;
    try {
      const __result = obj.${functionName}(${args});
      __output = _formatResult(__result);
    } catch (error) {
      __error = error && error.message ? error.message : String(error);
    }
    const __caseTimeMs = Date.now() - __caseStart;
    process.stdout.write(JSON.stringify({ index: ${caseIndex}, output: __output, error: __error, timeMs: __caseTimeMs, memoryKb: null }) + "\\n");
  }`;
    })
    .join("\n");

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
${casesCode}
})();
`;
}

export function buildBatchWrappedCode(
  language: SupportedLanguage,
  userCode: string,
  functionName: string,
  cases: JudgeCase[],
  inputType?: string
): string {
  if (language === "java") return buildJavaBatchWrapper(userCode, functionName, cases, inputType);
  if (language === "cpp") return buildCppBatchWrapper(userCode, functionName, cases, inputType);
  if (language === "javascript") return buildJavascriptBatchWrapper(userCode, functionName, cases, inputType);
  return buildPythonBatchWrapper(userCode, functionName, cases, inputType);
}

"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { Maximize2, Minimize2, Copy, Check, RefreshCw } from "lucide-react";
import { useState } from "react";

type Props = {
  isDark: boolean;
  language: string;
  code: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onRun?: () => void;
  onSubmit?: () => void;
  executing?: boolean;
  executionMode?: "run" | "submit" | null;
  diagnostics?: Array<{
    line: number;
    column?: number;
    severity: "error" | "warning" | "note";
    message: string;
    source: "compile" | "runtime";
  }>;
  onChange: (value: string) => void;
  onResetCode?: () => void;
};

type MonacoModelLike = unknown;
type MonacoEditorLike = {
  getModel: () => MonacoModelLike | null;
  addCommand: (keybinding: number, handler: () => void) => void;
};
type MonacoLike = {
  editor: {
    setModelMarkers: (
      model: MonacoModelLike,
      owner: string,
      markers: Array<{
        startLineNumber: number;
        endLineNumber: number;
        startColumn: number;
        endColumn: number;
        message: string;
        severity: number;
      }>
    ) => void;
  };
  KeyMod: { CtrlCmd: number; Shift: number };
  KeyCode: { Enter: number };
  MarkerSeverity: { Warning: number; Info: number; Error: number };
};

function monacoLanguage(lang: string): string {
  const normalized = String(lang || "").toLowerCase();
  if (normalized === "cpp" || normalized === "c++") return "cpp";
  if (normalized === "java") return "java";
  if (normalized === "python" || normalized === "py") return "python";
  if (normalized === "javascript" || normalized === "js") return "javascript";
  if (normalized === "typescript" || normalized === "ts") return "typescript";
  if (normalized === "sql" || normalized === "mysql" || normalized === "pgsql" || normalized === "postgresql") return "sql";
  if (normalized === "mongodb") return "json";
  return normalized;
}

const LANG_LABELS: Record<string, string> = {
  cpp: "C++",
  java: "Java",
  python: "Python 3",
  javascript: "JavaScript",
  typescript: "TypeScript",
  sql: "SQL",
  mysql: "MySQL",
  pgsql: "PostgreSQL",
  mongodb: "MongoDB",
};

export function CodeEditor({
  isDark,
  language,
  code,
  isMaximized = false,
  onToggleMaximize,
  onRun,
  onSubmit,
  executing = false,
  executionMode,
  diagnostics = [],
  onChange,
  onResetCode,
}: Props) {
  const editorRef = useRef<MonacoEditorLike | null>(null);
  const monacoRef = useRef<MonacoLike | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;

    const markers = (Array.isArray(diagnostics) ? diagnostics : [])
      .filter((item) => Number.isFinite(item.line) && item.line > 0)
      .slice(0, 80)
      .map((item) => ({
        startLineNumber: Math.max(1, Math.floor(item.line)),
        endLineNumber: Math.max(1, Math.floor(item.line)),
        startColumn: Math.max(1, Math.floor(item.column || 1)),
        endColumn: Math.max(2, Math.floor(item.column || 1) + 1),
        message: `[${item.source}] ${item.message}`,
        severity:
          item.severity === "warning"
            ? monaco.MarkerSeverity.Warning
            : item.severity === "note"
            ? monaco.MarkerSeverity.Info
            : monaco.MarkerSeverity.Error,
      }));

    monaco.editor.setModelMarkers(model, "execution-diagnostics", markers);
  }, [diagnostics, code, language]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const isRunning = executing && executionMode === "run";
  const isSubmitting = executing && executionMode === "submit";

  return (
    <div
      className="h-full min-h-0 overflow-hidden flex flex-col"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Header toolbar */}
      <div
        className="flex items-center justify-between gap-2 px-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
          height: "42px",
        }}
      >
        {/* Left: lang badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              background: "rgba(88,166,255,0.12)",
              color: "var(--brand-blue)",
              border: "1px solid rgba(88,166,255,0.2)",
            }}
          >
            {LANG_LABELS[language] ?? language.toUpperCase()}
          </span>
          <span
            className="text-xs hidden sm:inline"
            style={{ color: "var(--text-muted)" }}
          >
            Ctrl+Enter to run · Ctrl+Shift+Enter to submit
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {onResetCode && (
            <button
              type="button"
              onClick={onResetCode}
              disabled={executing}
              title="Reset to starter code"
              className="btn btn-ghost"
              style={{ padding: "4px 8px", fontSize: "11px", gap: "4px" }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void copyCode()}
            title={copied ? "Copied!" : "Copy code"}
            className="btn btn-ghost"
            style={{ padding: "4px 8px", fontSize: "11px", gap: "4px" }}
          >
            {copied ? (
              <Check style={{ width: 12, height: 12, color: "var(--color-accepted)" }} />
            ) : (
              <Copy style={{ width: 12, height: 12 }} />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              title={isMaximized ? "Restore split view" : "Maximize editor"}
              className="btn btn-ghost"
              style={{ padding: "4px 8px" }}
            >
              {isMaximized ? (
                <Minimize2 style={{ width: 13, height: 13 }} />
              ) : (
                <Maximize2 style={{ width: 13, height: 13 }} />
              )}
            </button>
          )}

          {/* Run & Submit buttons in toolbar for easy access */}
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={executing}
              className="btn btn-run"
              style={{ padding: "5px 14px", fontSize: "12px" }}
            >
              {isRunning ? (
                <>
                  <span className="spinner" />
                  Running…
                </>
              ) : (
                "▶ Run"
              )}
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={executing}
              className="btn btn-submit"
              style={{ padding: "5px 14px", fontSize: "12px" }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={monacoLanguage(language)}
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={(editor, monaco) => {
            editorRef.current = editor as unknown as MonacoEditorLike;
            monacoRef.current = monaco as unknown as MonacoLike;
            const bindings = monaco as unknown as MonacoLike;
            if (typeof onRun === "function") {
              editor.addCommand(bindings.KeyMod.CtrlCmd | bindings.KeyCode.Enter, () => onRun());
            }
            if (typeof onSubmit === "function") {
              editor.addCommand(
                bindings.KeyMod.CtrlCmd | bindings.KeyMod.Shift | bindings.KeyCode.Enter,
                () => onSubmit()
              );
            }
          }}
          theme={isDark ? "vs-dark" : "vs"}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Cascadia Mono', 'Consolas', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbersMinChars: 3,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "off",
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            lineHeight: 22,
            letterSpacing: 0.3,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            matchBrackets: "always",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
          }}
        />
      </div>
    </div>
  );
}

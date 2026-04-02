"use client";

import Editor from "@monaco-editor/react";

type Props = {
  isDark: boolean;
  language: "cpp" | "java" | "python";
  code: string;
  onChange: (value: string) => void;
};

function monacoLanguage(lang: Props["language"]): "cpp" | "java" | "python" {
  return lang;
}

export function CodeEditor({ isDark, language, code, onChange }: Props) {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/65">
      <Editor
        height="100%"
        language={monacoLanguage(language)}
        value={code}
        onChange={(value) => onChange(value || "")}
        theme={isDark ? "vs-dark" : "vs"}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbersMinChars: 3,
          tabSize: 2,
        }}
      />
    </div>
  );
}

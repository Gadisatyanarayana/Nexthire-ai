"use client";

import React, { useRef, useState, useEffect } from 'react';
import Editor, { useMonaco, Monaco } from '@monaco-editor/react';

interface MonacoEditorWrapperProps {
  initialCode: string;
  language: string;
  onChange: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  onRun?: (value: string) => void;
  readOnly?: boolean;
}

export default function MonacoEditorWrapper({
  initialCode,
  language,
  onChange,
  onSave,
  onRun,
  readOnly = false
}: MonacoEditorWrapperProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (monaco) {
      // Define custom themes
      monaco.editor.defineTheme('nexthire-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#181818',
        }
      });
      monaco.editor.setTheme('nexthire-dark');
    }
  }, [monaco]);

  const handleEditorDidMount = (editor: any, monacoInstance: Monaco) => {
    editorRef.current = editor;

    // Keyboard Shortcuts
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      const val = editor.getValue();
      if (onSave) onSave(val);
    });

    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      const val = editor.getValue();
      if (onRun) onRun(val);
    });
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <Editor
        height="100%"
        language={language}
        value={initialCode}
        theme="nexthire-dark"
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 16 }
        }}
      />
    </div>
  );
}

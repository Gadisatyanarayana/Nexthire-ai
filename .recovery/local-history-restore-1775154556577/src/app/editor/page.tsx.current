'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MonacoEditor from '@monaco-editor/react';
import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const LANGUAGES = {
  javascript: { id: 63, name: 'JavaScript' },
  python: { id: 71, name: 'Python' },
  cpp: { id: 54, name: 'C++' },
  java: { id: 62, name: 'Java' },
};

export default function CodeEditor() {
  const { data: session } = useSession();
  const [code, setCode] = useState('console.log("Hello, World!");');
  const [language, setLanguage] = useState<keyof typeof LANGUAGES>('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  async function runCode() {
    setIsRunning(true);
    setOutput('Running...');

    try {
      const response = await axios.post('/api/execute', {
        code,
        language: LANGUAGES[language].id,
      });

      setOutput(response.data.output || response.data.error || 'No output');
    } catch (error: unknown) {
      const maybeError = error as { response?: { data?: { error?: string } }; message?: string };
      setOutput(`Error: ${maybeError.response?.data?.error || maybeError.message || 'Execution failed'}`);
    } finally {
      setIsRunning(false);
    }
  }

  async function getAIFeedback() {
    setIsFeedbackLoading(true);
    try {
      const response = await axios.post('/api/ai-feedback', {
        code,
        language,
      });
      setFeedback(response.data.feedback);
    } catch (error: unknown) {
      const maybeError = error as { message?: string };
      setFeedback(`Error: ${maybeError.message || 'Failed to fetch AI feedback'}`);
    } finally {
      setIsFeedbackLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Please sign in to use the editor</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 px-6 pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Code Editor</h1>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as keyof typeof LANGUAGES)}
            className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2"
          >
            {Object.entries(LANGUAGES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <MonacoEditor
              height="500px"
              defaultLanguage={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'Fira Code',
              }}
            />
          </GlassCard>

          {/* Output & Controls */}
          <div className="space-y-4">
            <GlassCard className="h-64 overflow-y-auto">
              <h2 className="text-white font-bold mb-3">Output</h2>
              <pre className="text-white/80 text-sm font-mono whitespace-pre-wrap">
                {output}
              </pre>
            </GlassCard>

            <div className="flex gap-3">
              <Button
                onClick={runCode}
                isLoading={isRunning}
                className="flex-1"
              >
                Run
              </Button>
              <Button
                onClick={getAIFeedback}
                variant="secondary"
                isLoading={isFeedbackLoading}
                className="flex-1"
              >
                AI Feedback
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <GlassCard>
            <h2 className="text-white font-bold mb-3">AI Analysis</h2>
            <div className="text-white/70 whitespace-pre-wrap">{feedback}</div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

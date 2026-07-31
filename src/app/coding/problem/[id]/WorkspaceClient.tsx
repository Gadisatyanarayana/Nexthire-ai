"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import MonacoEditorWrapper from '@/components/coding/MonacoEditorWrapper';
import { 
  Sparkles, Code2, Layers, BookOpen, Lightbulb, AlertTriangle, Building2, 
  HelpCircle, Play, CheckCircle2, ChevronRight, ArrowRight, Wand2
} from 'lucide-react';
import type { QuestionRichMetadata } from '@/lib/codingMetadata';

export default function WorkspaceClient({ problemId }: { problemId: string }) {
  const [problem, setProblem] = useState<any>(null);
  const [richMeta, setRichMeta] = useState<QuestionRichMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'solutions' | 'insights' | 'ai' | 'progression'>('description');
  const [activeSolutionIdx, setActiveSolutionIdx] = useState<number>(0);

  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AI Assistant In-Page response state
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch initial state
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const res = await fetch(`/api/coding/problem/${problemId}`);
        const data = await res.json();
        
        if (data.problem) {
          setProblem(data.problem);
          if (data.richMetadata) {
            setRichMeta(data.richMetadata);
          }
          
          if (data.session && data.session.code_content) {
            setLanguage(data.session.current_language);
            setCode(data.session.code_content);
          } else {
            const defaultLang = 'javascript';
            setLanguage(defaultLang);
            const starter = data.problem.codingDetails?.starter_code?.[defaultLang] || '';
            setCode(starter);
          }
        }
      } catch (err) {
        console.error("Failed to load workspace", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspace();
  }, [problemId]);

  // Autosave hook
  useEffect(() => {
    if (isLoading || !problem) return;
    
    const timeout = setTimeout(() => {
      fetch('/api/coding/editor-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          language,
          code,
          cursorPosition: null
        })
      }).catch(console.error);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [code, language, problem, problemId, isLoading]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, language, code })
      });
      const data = await res.json();
      setOutput(data.error ? { error: data.error } : data);
    } catch (err: any) {
      setOutput({ error: err.message });
    }
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, language, code })
      });
      const data = await res.json();
      setOutput(data.error ? { error: data.error } : data);
    } catch (err: any) {
      setOutput({ error: err.message });
    }
    setIsRunning(false);
  };

  const handleAiAction = async (actionType: string) => {
    setAiLoading(true);
    setAiOutput(null);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Please assist with the problem "${problem?.title}". Action requested: ${actionType}. My current code in ${language} is:\n\n\`\`\`${language}\n${code}\n\`\`\``
            }
          ]
        })
      });
      const data = await res.json();
      setAiOutput(data.reply || data.response || "AI response generated successfully.");
    } catch (e: any) {
      setAiOutput(`Error generating AI guidance: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const starter = problem?.codingDetails?.starter_code?.[newLang] || '';
    setCode(starter);
  };

  if (isLoading) {
    return <div className="p-8 text-zinc-400 bg-black h-full flex items-center justify-center">Loading Enterprise Workspace...</div>;
  }

  if (!problem) {
    return <div className="p-8 text-red-400 bg-black h-full flex items-center justify-center">Failed to load problem.</div>;
  }

  return (
    <PanelGroup orientation="horizontal" className="h-full bg-black text-white font-sans">
      {/* Left Pane: Workspace Tabs (Description, Solutions, Insights, AI Assistant, Progression) */}
      <Panel defaultSize={45} minSize={25} className="bg-zinc-950 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
        {/* Workspace Tab Header */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/80 shrink-0 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'description' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'solutions' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Solutions ({richMeta?.solutions?.length || 2})
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'insights' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Interview Insights
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'ai' ? 'border-amber-500 text-amber-300 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'progression' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Progression Chain
          </button>
        </div>

        {/* Workspace Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-zinc-300">
          
          {/* Metadata Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-white">{problem.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                problem.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                problem.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {problem.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                Pattern: {richMeta?.primaryPattern || 'Two Pointers'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-zinc-300 font-mono">
                Subtopic: {richMeta?.subtopic || 'Arrays'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-zinc-300 font-mono">
                Complexity: {richMeta?.timeComplexity || 'O(n)'} / {richMeta?.spaceComplexity || 'O(1)'}
              </span>
            </div>

            {/* Target Companies */}
            {richMeta?.companies && richMeta.companies.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Asked At:</span>
                <div className="flex flex-wrap gap-1">
                  {richMeta.companies.map((c) => (
                    <span key={c.name} className="px-2 py-0.5 rounded bg-black text-[10px] text-zinc-300 border border-zinc-800">
                      {c.name} ({c.tier})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
              
              {problem.codingDetails?.constraints && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px]">Constraints</h4>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300 font-mono">
                    {problem.codingDetails.constraints.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOLUTIONS & PATTERNS (Multi-Approach Engine) */}
          {activeTab === 'solutions' && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-zinc-800 pb-2">
                {(richMeta?.solutions || []).map((sol, idx) => (
                  <button
                    key={sol.id}
                    onClick={() => setActiveSolutionIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeSolutionIdx === idx ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Solution {idx + 1}: {sol.pattern}
                  </button>
                ))}
              </div>

              {richMeta?.solutions?.[activeSolutionIdx] && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <h4 className="font-bold text-sm text-white">{richMeta.solutions[activeSolutionIdx].title}</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed">{richMeta.solutions[activeSolutionIdx].explanation}</p>
                    <div className="flex gap-4 text-[11px] font-mono text-emerald-400 pt-2 border-t border-zinc-800">
                      <span>Time: {richMeta.solutions[activeSolutionIdx].timeComplexity}</span>
                      <span>Space: {richMeta.solutions[activeSolutionIdx].spaceComplexity}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERVIEW INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">Why Recruiter Asks This Question</h4>
                <p className="text-zinc-300 text-xs">{richMeta?.insights.whyAsked}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">Interviewer Follow-Up Questions</h4>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  {richMeta?.insights.interviewerFollowups.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-xs text-red-400 uppercase tracking-wider">Common Candidate Mistakes</h4>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  {richMeta?.insights.candidateMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: IN-PAGE AI ASSISTANT */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <h4 className="font-bold flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4" /> In-Page AI Assistant
                </h4>
                <p className="text-amber-200/80">Get real-time hints, editorial walkthroughs, dry runs, and code reviews without leaving your workspace.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAiAction("Explain Hint")}
                  disabled={aiLoading}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-left font-semibold text-zinc-200 text-xs transition"
                >
                  💡 Explain Hint
                </button>
                <button
                  onClick={() => handleAiAction("Dry Run Execution")}
                  disabled={aiLoading}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-left font-semibold text-zinc-200 text-xs transition"
                >
                  🏃 Dry Run Code
                </button>
                <button
                  onClick={() => handleAiAction("Time & Space Complexity Analysis")}
                  disabled={aiLoading}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-left font-semibold text-zinc-200 text-xs transition"
                >
                  ⏱️ Analyze Complexity
                </button>
                <button
                  onClick={() => handleAiAction("Mock Interview Followup")}
                  disabled={aiLoading}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-left font-semibold text-zinc-200 text-xs transition"
                >
                  🎙️ Mock Interview Query
                </button>
              </div>

              {aiLoading && <p className="text-center py-6 text-amber-400 animate-pulse font-semibold text-xs">AI analyzing code & generating guidance...</p>}

              {aiOutput && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {aiOutput}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROGRESSION CHAIN */}
          {activeTab === 'progression' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prerequisite Warmup</span>
                {richMeta?.prerequisites.map((p) => (
                  <Link key={p.id} href={`/coding/problem/${p.id}`} className="block font-bold text-emerald-400 hover:underline">
                    {p.title}
                  </Link>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Current Problem</span>
                <h4 className="font-bold text-white text-sm">{problem.title}</h4>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Next Recommended</span>
                {richMeta?.nextProblems.map((n) => (
                  <Link key={n.id} href={`/coding/problem/${n.id}`} className="block font-bold text-emerald-400 hover:underline">
                    {n.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </Panel>

      <PanelResizeHandle className="w-2 bg-zinc-900 hover:bg-emerald-500 transition-colors cursor-col-resize flex flex-col justify-center items-center">
        <div className="h-8 w-1 bg-zinc-700 rounded-full" />
      </PanelResizeHandle>

      {/* Right Pane: Monaco Editor and Console */}
      <Panel minSize={30} className="flex flex-col h-full overflow-hidden">
        <PanelGroup orientation="vertical">
          {/* Top Right: Editor */}
          <Panel defaultSize={70} minSize={20} className="flex flex-col bg-[#0d1117]">
            <div className="h-12 bg-zinc-900 flex items-center justify-between px-4 shrink-0 border-b border-zinc-800">
              <select 
                value={language} 
                onChange={handleLanguageChange}
                className="bg-black border border-zinc-800 text-xs text-white rounded px-3 py-1.5 outline-none"
              >
                {(problem.codingDetails?.supported_languages || ['javascript', 'python', 'cpp', 'java']).map((lang: string) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button 
                  onClick={handleRun}
                  disabled={isRunning}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Run Code
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isRunning}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-extrabold transition disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <MonacoEditorWrapper
                language={language}
                initialCode={code}
                onChange={(val) => setCode(val || '')}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="h-2 bg-zinc-900 hover:bg-emerald-500 transition-colors cursor-row-resize flex justify-center items-center">
            <div className="w-8 h-1 bg-zinc-700 rounded-full" />
          </PanelResizeHandle>

          {/* Bottom Right: Console Output */}
          <Panel defaultSize={30} minSize={10} className="bg-zinc-950 flex flex-col">
            <div className="h-10 bg-zinc-900 flex items-center px-4 shrink-0 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Console Output</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
              {!output && <span className="text-zinc-500">Run or Submit code to view test case execution results.</span>}
              {output && output.status === 'Accepted' && (
                <div className="text-emerald-400 space-y-1">
                  <div className="font-bold text-sm">Accepted!</div>
                  <div>Passed Cases: {output.passedCases || 10} / {output.totalCases || 10}</div>
                  <div className="text-zinc-400 text-[11px]">Runtime: {output.executionTimeMs || 45} ms | Memory: {output.memoryUsageKb || 14200} KB</div>
                </div>
              )}
              {output && output.error && (
                <div className="text-red-400">
                  <div className="font-bold text-sm">Execution Error</div>
                  <pre className="mt-2 p-3 bg-black border border-red-500/20 rounded text-red-300 text-xs">{output.error}</pre>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}

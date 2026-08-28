"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

const MonacoEditorWrapper = dynamic(() => import('@/components/coding/MonacoEditorWrapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-[#181818] text-zinc-400 font-mono text-xs gap-3">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading Editor Engine...</span>
    </div>
  ),
});
import { 
  Sparkles, Code2, Layers, BookOpen, Lightbulb, AlertTriangle, Building2, 
  HelpCircle, Play, CheckCircle2, ChevronRight, ArrowRight, Wand2, ChevronLeft, ArrowLeft,
  Shuffle, CloudUpload, Clock, User, Award, Check, X, ThumbsUp, ThumbsDown,
  MessageSquare, ExternalLink, RefreshCw, Maximize2, Minimize2, Copy
} from 'lucide-react';
import type { QuestionRichMetadata } from '@/lib/codingMetadata';

const SIMILAR_QUESTIONS_MOCK = [
  { id: "multiply-strings", title: "Multiply Strings", difficulty: "Medium" },
  { id: "add-binary", title: "Add Binary", difficulty: "Easy" },
  { id: "sum-of-two-integers", title: "Sum of Two Integers", difficulty: "Medium" },
  { id: "add-strings", title: "Add Strings", difficulty: "Easy" },
  { id: "add-two-numbers-ii", title: "Add Two Numbers II", difficulty: "Medium" },
  { id: "add-to-array-form-of-integer", title: "Add to Array-Form of Integer", difficulty: "Easy" },
];

export default function WorkspaceClient({ problemId }: { problemId: string }) {
  const router = useRouter();
  const [problem, setProblem] = useState<any>(null);
  const [richMeta, setRichMeta] = useState<QuestionRichMetadata | null>(null);
  
  // Left Panel Active Tab
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'solutions' | 'submissions'>('description');
  
  // Right Panel Code Tab
  const [codeTab, setCodeTab] = useState<'code' | 'solutions' | 'submissions'>('code');
  
  // Console Tab
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  
  // Accordion Toggles
  const [showTopics, setShowTopics] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSimilar, setShowSimilar] = useState(true);
  const [showDiscussion, setShowDiscussion] = useState(false);

  // Language & Code
  const [language, setLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Timer Play / Pause State
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [userVoted, setUserVoted] = useState<'yes' | 'no' | null>(null);

  // Custom Testcases state
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput?: string }>>([
    { input: "[2,7,11,15]\n9" },
    { input: "[3,2,4]\n6" },
    { input: "[3,3]\n6" }
  ]);

  // Submission Animation State
  const [submissionPhase, setSubmissionPhase] = useState<'idle' | 'pending' | 'judging' | 'animating' | 'done'>('idle');
  const [animatedPassedCount, setAnimatedPassedCount] = useState(0);
  const [targetPassedCount, setTargetPassedCount] = useState(0);
  const [totalCasesCount, setTotalCasesCount] = useState(0);
  const [failedCaseIndex, setFailedCaseIndex] = useState(-1);


  // Stopwatch timer hook with play/pause support
  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch initial workspace payload
  useEffect(() => {
    async function loadWorkspace() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/coding/problem/${problemId}`);
        const data = await res.json();
        
        if (data.problem || data.id) {
          const probData = data.problem || data;
          setProblem(probData);
          if (data.richMetadata) {
            setRichMeta(data.richMetadata);
          }
          
          const defaultLang = 'java';
          setLanguage(defaultLang);

          if (data.session && data.session.code_content) {
            setCode(data.session.code_content);
          } else {
            const starterRaw = probData.codingDetails?.starter_code?.[defaultLang] || 
                               probData.starter_code?.[defaultLang] || 
                               (typeof probData.starter_code === 'string' ? probData.starter_code : null);
            const starter = (typeof starterRaw === 'string' && starterRaw.trim().length > 0)
              ? starterRaw
              : `class Solution {\n    // TODO: Write your solution here\n}`;
            setCode(starter);
          }

          if (probData.testcases && probData.testcases.length > 0) {
            setTestCases(probData.testcases.slice(0, 3).map((tc: any) => ({
              input: tc.input || "",
              expectedOutput: tc.expectedOutput || ""
            })));
          } else if (probData.examples && probData.examples.length > 0) {
            setTestCases(probData.examples.slice(0, 3).map((ex: any) => ({
              input: ex.input || "",
              expectedOutput: ex.output || ""
            })));
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

  // Animation Engine Hook
  useEffect(() => {
    if (submissionPhase === 'animating') {
      const interval = setInterval(() => {
        setAnimatedPassedCount(prev => {
          if (prev < targetPassedCount) {
            return prev + 1;
          }
          clearInterval(interval);
          setSubmissionPhase('done');
          return prev;
        });
      }, 30); // 30ms per case for a fast, snappy sweep
      return () => clearInterval(interval);
    }
  }, [submissionPhase, targetPassedCount]);


  // Handle language switch
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const starterRaw = problem?.codingDetails?.starter_code?.[newLang] || 
                       problem?.starter_code?.[newLang] || 
                       (typeof problem?.starter_code === 'string' ? problem.starter_code : null);
    const starter = (typeof starterRaw === 'string' && starterRaw.trim().length > 0)
      ? starterRaw
      : newLang === 'python' ? `class Solution:\n    # TODO: Write your solution here\n    pass`
      : newLang === 'cpp' ? `class Solution {\npublic:\n    // TODO: Write your solution here\n};`
      : newLang === 'javascript' ? `// TODO: Write your solution here`
      : `class Solution {\n    // TODO: Write your solution here\n}`;
    setCode(starter);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleTab('result');
    setOutput(null);
    try {
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          problemId, 
          language, 
          code,
          testcases: [{ 
            input: testCases[activeCaseIdx]?.input || "",
            expectedOutput: testCases[activeCaseIdx]?.expectedOutput || "",
            isHidden: false 
          }] 
        })
      });
      const data = await res.json();
      setOutput(data.error ? { error: typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error) } : data);
    } catch (err: any) {
      setOutput({ error: err.message || "Execution error" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    setConsoleTab('result');
    setOutput(null);
    setSubmissionPhase('pending');
    setAnimatedPassedCount(0);
    setFailedCaseIndex(-1);

    // Simulate "Pending" delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmissionPhase('judging');

    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, language, code })
      });
      const data = await res.json();
      
      const parsedOutput = data.error 
        ? { error: typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error) } 
        : data;
      
      setOutput(parsedOutput);

      if (!parsedOutput.error && !parsedOutput.compile_error && parsedOutput.cases) {
        const totalCases = parsedOutput.cases.length;
        // Count how many consecutive passed cases there are before a failure
        let consecutivePasses = 0;
        let failIdx = -1;
        for (let i = 0; i < totalCases; i++) {
          if (parsedOutput.cases[i].passed) {
            consecutivePasses++;
          } else {
            failIdx = i;
            break;
          }
        }
        
        setTotalCasesCount(totalCases);
        setTargetPassedCount(consecutivePasses);
        setFailedCaseIndex(failIdx);
        setSubmissionPhase('animating');
      } else {
        setSubmissionPhase('done');
      }

    } catch (err: any) {
      setOutput({ error: err.message || "Submission error" });
      setSubmissionPhase('done');
    } finally {
      setIsRunning(false);
    }
  };

  const handleNextProblem = () => {
    const nextId = String(Number(problemId) ? Number(problemId) + 1 : "2");
    router.push(`/coding/problem/${nextId}`);
  };

  const handlePrevProblem = () => {
    const prevId = String(Number(problemId) && Number(problemId) > 1 ? Number(problemId) - 1 : "1");
    router.push(`/coding/problem/${prevId}`);
  };

  const handleShuffle = () => {
    const randomId = String(Math.floor(Math.random() * 50) + 1);
    router.push(`/coding/problem/${randomId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#181818] text-zinc-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide">Loading Problem Workspace...</span>
      </div>
    );
  }

  const problemTitle = problem?.title || "1. Two Sum";
  const difficulty = problem?.difficulty || "Easy";
  const examples = problem?.examples && problem.examples.length > 0 ? problem.examples : [
    { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
    { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    { input: "nums = [3,3], target = 6", output: "[0,1]" }
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#181818] text-zinc-200 font-sans overflow-hidden select-none">
      
      {/* HEADER BAR (LeetCode Style Top Nav Bar) */}
      <header className="h-12 bg-[#282828] border-b border-[#3e3e3e] flex items-center justify-between px-3 shrink-0 text-xs z-30">
        
        {/* Left Section: Logo & Problem List Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/coding" className="flex items-center gap-2 hover:opacity-90 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6 shrink-0">
              <circle cx="256" cy="256" r="250" fill="#FFFFFF" />
              <path d="M 256 18 C 370 14, 475 90, 492 205 C 510 325, 435 445, 315 482 C 190 520, 55 440, 22 315 C -10 190, 75 50, 205 22 C 255 12, 315 15, 360 28" stroke="#2563EB" strokeWidth="20" fill="none" />
              <circle cx="178" cy="155" r="32" fill="#2563EB" />
              <path d="M 152 204 L 204 204 L 198 238 L 158 238 Z" fill="#2563EB" />
              <path d="M 157 242 L 199 242 L 207 335 L 178 405 L 149 335 Z" fill="#2563EB" />
              <text x="222" y="178" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="78" fill="#2563EB" letterSpacing="4">NEXT</text>
              <text x="96" y="356" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="92" fill="#2563EB">H</text>
              <text x="222" y="356" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="92" fill="#2563EB" letterSpacing="4">RE</text>
            </svg>
          </Link>

          <div className="h-4 w-[1px] bg-[#424242]" />

          <button 
            onClick={() => router.back()} 
            aria-label="Back to Previous Page"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#383838] hover:bg-[#484848] text-zinc-200 font-medium transition text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
            <span>Back</span>
          </button>

          <Link 
            href="/coding" 
            aria-label="Problem List"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#383838] hover:bg-[#484848] text-zinc-200 font-medium transition text-[11px]"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Problem List</span>
          </Link>

          <div className="flex items-center gap-0.5">
            <button onClick={handlePrevProblem} aria-label="Previous Question" className="p-1 rounded hover:bg-[#383838] text-zinc-400 hover:text-zinc-200 transition" title="Previous Question">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextProblem} aria-label="Next Question" className="p-1 rounded hover:bg-[#383838] text-zinc-400 hover:text-zinc-200 transition" title="Next Question">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={handleShuffle} aria-label="Shuffle Question" className="p-1 rounded hover:bg-[#383838] text-zinc-400 hover:text-zinc-200 transition ml-1" title="Shuffle / Pick Random Question">
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Section: Run, Submit & AI Action Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRun}
            disabled={isRunning}
            aria-label="Run Code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#383838] hover:bg-[#484848] text-zinc-200 font-semibold transition active:scale-95 disabled:opacity-50 text-xs"
          >
            <Play className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300" />
            <span>Run</span>
          </button>

          <button 
            onClick={handleSubmit}
            disabled={isRunning}
            aria-label="Submit Code"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition active:scale-95 disabled:opacity-50 text-xs shadow-md"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Submit</span>
          </button>

          <button 
            onClick={() => setActiveTab('solutions')}
            aria-label="AI Editorial & Solutions"
            className="p-1.5 rounded hover:bg-[#383838] text-amber-400 transition ml-1"
            title="AI Editorial & Solutions"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section: Timer Play/Pause Toggle */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-zinc-300 bg-[#1e1e1e] px-3 py-1 rounded border border-[#333]">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              aria-label={timerRunning ? "Pause Timer" : "Play Timer"}
              className="hover:text-emerald-400 transition cursor-pointer flex items-center justify-center"
              title={timerRunning ? "Pause Timer" : "Play Timer"}
            >
              {timerRunning ? (
                <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              )}
            </button>
            <span className="font-bold">{formatTimer(seconds)}</span>
          </div>
        </div>

      </header>

      {/* WORKSPACE CONTENT SPLIT PANE */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup orientation="horizontal" className="h-full">
          
          {/* LEFT PANEL: Problem Description / Editorial / Solutions */}
          <Panel defaultSize={45} minSize={30} className="bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col h-full overflow-hidden">
            
            {/* Left Panel Tabs Header */}
            <div className="h-9 bg-[#282828] border-b border-[#333] flex items-center px-2 shrink-0 text-xs font-medium">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-3 py-1.5 border-b-2 transition ${activeTab === 'description' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('editorial')}
                className={`px-3 py-1.5 border-b-2 transition ${activeTab === 'editorial' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                Editorial
              </button>
              <button
                onClick={() => setActiveTab('solutions')}
                className={`px-3 py-1.5 border-b-2 transition ${activeTab === 'solutions' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                Solutions
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1.5 border-b-2 transition ${activeTab === 'submissions' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                Submissions
              </button>
            </div>

            {/* Left Panel Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-zinc-300">
              
              {activeTab === 'description' && (
                <>
                  {/* Title & Status Badges */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h1 className="text-xl font-extrabold text-white">{problemTitle}</h1>
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" /> Solved
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {difficulty}
                      </span>

                      <button 
                        onClick={() => setShowTopics(!showTopics)} 
                        className="px-2.5 py-0.5 rounded-full bg-[#2a2a2a] hover:bg-[#333] text-zinc-300 border border-[#3e3e3e] text-[11px] flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3 text-zinc-400" /> Topics
                      </button>

                      <button 
                        onClick={() => setShowCompanies(!showCompanies)} 
                        className="px-2.5 py-0.5 rounded-full bg-[#2a2a2a] hover:bg-[#333] text-zinc-300 border border-[#3e3e3e] text-[11px] flex items-center gap-1"
                      >
                        <Building2 className="w-3 h-3 text-zinc-400" /> Companies
                      </button>

                      <button 
                        onClick={() => setShowHints(!showHints)} 
                        className="px-2.5 py-0.5 rounded-full bg-[#2a2a2a] hover:bg-[#333] text-zinc-300 border border-[#3e3e3e] text-[11px] flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-400" /> Hint
                      </button>
                    </div>

                    {/* Topics Expanded Box */}
                    {showTopics && (
                      <div className="p-3 rounded-xl bg-[#252525] border border-[#383838] flex flex-wrap gap-1.5">
                        {(richMeta?.topics || problem?.topic || ["Arrays", "Hash Table"]).map((t: string) => (
                          <span key={t} className="px-2.5 py-1 rounded bg-[#1a1a1a] text-zinc-300 text-[11px] font-mono border border-[#333]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Companies Expanded Box */}
                    {showCompanies && (
                      <div className="p-3 rounded-xl bg-[#252525] border border-[#383838] flex flex-wrap gap-1.5">
                        {(richMeta?.companies?.map(c => c.name) || problem?.company_tags || ["Google", "Amazon", "Meta", "Microsoft"]).map((c: string) => (
                          <span key={c} className="px-2.5 py-1 rounded bg-[#1a1a1a] text-zinc-300 text-[11px] border border-[#333] flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-400" /> {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Hints Expanded Box */}
                    {showHints && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> Hint 1:</p>
                        <p className="leading-relaxed">A really brute force way would be to search for all possible pairs of numbers. Can we do better using a Hash Map to store complement targets?</p>
                      </div>
                    )}
                  </div>

                  {/* Problem Description Text */}
                  <div className="space-y-3 leading-relaxed text-zinc-200 text-xs">
                    <p>Given an array of integers <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">nums</code> and an integer <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">target</code>, return <em>indices of the two numbers such that they add up to <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">target</code></em>.</p>
                    <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.</p>
                    <p>You can return the answer in any order.</p>
                  </div>

                  {/* Examples Section */}
                  <div className="space-y-4">
                    {examples.map((ex: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="font-bold text-zinc-300 text-xs">Example {idx + 1}:</h4>
                        <div className="p-3 rounded-xl bg-[#252525] border border-[#333] font-mono text-xs space-y-1 text-zinc-200">
                          <div><strong className="text-zinc-400">Input:</strong> {ex.input}</div>
                          <div><strong className="text-zinc-400">Output:</strong> {ex.output}</div>
                          {ex.explanation && (
                            <div className="pt-1 text-zinc-400 text-[11px]"><strong className="text-zinc-400">Explanation:</strong> {ex.explanation}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Constraints Section */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider">Constraints:</h4>
                    <ul className="list-disc pl-5 space-y-1 font-mono text-zinc-300 text-[11px]">
                      <li><code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-amber-300">2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
                      <li><code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-amber-300">-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
                      <li><code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-amber-300">-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
                      <li className="text-emerald-400 font-semibold">Only one valid answer exists.</li>
                    </ul>
                  </div>

                  {/* Interview Survey Feedback */}
                  <div className="p-3.5 rounded-xl bg-[#252525] border border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <span className="text-zinc-400">Seen this question in a real interview before?</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setUserVoted('yes')}
                        className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 ${userVoted === 'yes' ? 'bg-emerald-600 text-white' : 'bg-[#333] hover:bg-[#444] text-zinc-300'}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Yes
                      </button>
                      <button 
                        onClick={() => setUserVoted('no')}
                        className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 ${userVoted === 'no' ? 'bg-red-600 text-white' : 'bg-[#333] hover:bg-[#444] text-zinc-300'}`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> No
                      </button>
                    </div>
                  </div>

                  {/* Acceptance & Submission Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#333] text-zinc-400 text-xs">
                    <div>Accepted <strong className="text-zinc-200 font-mono">7,336,104</strong> / 15M</div>
                    <div>Acceptance Rate <strong className="text-zinc-200 font-mono">{problem?.acceptance_rate || 49.0}%</strong></div>
                  </div>

                  {/* Similar Questions Collapsible Accordion */}
                  <div className="border-t border-[#333] pt-4 space-y-3">
                    <button 
                      onClick={() => setShowSimilar(!showSimilar)}
                      className="w-full flex items-center justify-between font-bold text-xs text-zinc-300 hover:text-white"
                    >
                      <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-blue-400" /> Similar Questions</span>
                      <span className="text-zinc-400">{showSimilar ? '▲' : '▼'}</span>
                    </button>

                    {showSimilar && (
                      <div className="space-y-1.5 pl-2">
                        {SIMILAR_QUESTIONS_MOCK.map((sq) => (
                          <Link 
                            key={sq.id}
                            href={`/coding/problem/${sq.id}`}
                            className="flex items-center justify-between p-2 rounded hover:bg-[#282828] text-zinc-300 hover:text-blue-400 transition"
                          >
                            <span className="font-semibold text-xs">{sq.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              sq.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                            }`}>
                              {sq.difficulty}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discussion Accordion */}
                  <div className="border-t border-[#333] pt-4 space-y-3">
                    <button 
                      onClick={() => setShowDiscussion(!showDiscussion)}
                      className="w-full flex items-center justify-between font-bold text-xs text-zinc-300 hover:text-white"
                    >
                      <span className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Discussion (1.1K)</span>
                      <span className="text-zinc-400">{showDiscussion ? '▲' : '▼'}</span>
                    </button>

                    {showDiscussion && (
                      <div className="p-3 rounded-xl bg-[#252525] border border-[#333] text-zinc-400 text-xs space-y-2">
                        <p className="font-semibold text-zinc-200">Optimal One-Pass Hash Map Solution (Java/Python)</p>
                        <p className="text-[11px] leading-relaxed">By maintaining an element-to-index mapping as we iterate through the array, we can check for `target - current` in O(1) time complexity.</p>
                      </div>
                    )}
                  </div>

                </>
              )}

              {activeTab === 'editorial' && (
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-white">Official Editorial Solution</h3>
                  <div className="p-4 rounded-xl bg-[#252525] border border-[#333] space-y-3">
                    <h4 className="font-bold text-sm text-blue-400">Approach 1: One-Pass Hash Map [Accepted]</h4>
                    <p className="leading-relaxed text-xs text-zinc-300">While we iterate and insert elements into the table, we also look back to check if current element&apos;s complement already exists in the table. If it exists, we have found the solution and return immediately.</p>
                    <div className="p-3 rounded bg-[#181818] font-mono text-xs text-emerald-400">
                      Time Complexity: O(N) | Space Complexity: O(N)
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'solutions' && (
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-white">Community & AI Solutions</h3>
                  <div className="p-4 rounded-xl bg-[#252525] border border-[#333] space-y-3 font-mono text-xs">
                    <div className="text-blue-400 font-bold">Java 17 Solution:</div>
                    <pre className="p-3 bg-[#181818] rounded text-zinc-200 overflow-x-auto">
{`class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-3">
                  <h3 className="text-base font-extrabold text-white">Submission History</h3>
                  <div className="p-3 rounded-xl bg-[#252525] border border-[#333] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Accepted</span>
                    <span className="font-mono text-zinc-400">42 ms</span>
                    <span className="font-mono text-zinc-400">14.2 MB</span>
                    <span className="text-zinc-400">Just now</span>
                  </div>
                </div>
              )}

            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-[#282828] hover:bg-blue-600 transition cursor-col-resize shrink-0" />

          {/* RIGHT PANEL: Code Editor & Testcase Console */}
          <Panel defaultSize={55} minSize={30} className="bg-[#181818] flex flex-col h-full overflow-hidden">
            
            <PanelGroup orientation="vertical" className="h-full">
              
              {/* TOP SUB-PANE: Code Editor */}
              <Panel defaultSize={65} minSize={30} className="flex flex-col bg-[#181818] overflow-hidden">
                
                {/* Editor Header & Controls Bar */}
                <div className="h-9 bg-[#282828] border-b border-[#333] flex items-center justify-between px-3 shrink-0 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-blue-400" /> Code
                    </span>

                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      aria-label="Select Programming Language"
                      className="bg-[#1e1e1e] text-zinc-200 border border-[#383838] rounded px-2.5 py-0.5 text-xs font-bold outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="cpp">C++ (GCC 13)</option>
                      <option value="python">Python 3.12</option>
                      <option value="java">Java 21</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCode(problem?.codingDetails?.starter_code?.[language] || "")}
                      aria-label="Reset Code to Default"
                      className="p-1 rounded hover:bg-[#383838] text-zinc-400 hover:text-zinc-200 transition"
                      title="Reset Code to Default"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Container */}
                <div className="flex-1 overflow-hidden relative">
                  <MonacoEditorWrapper
                    initialCode={code}
                    language={language}
                    onChange={(val) => setCode(val || "")}
                    onRun={handleRun}
                    onSave={handleSubmit}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="h-1.5 bg-[#282828] hover:bg-blue-600 transition cursor-row-resize shrink-0" />

              {/* BOTTOM SUB-PANE: Testcase & Results Console */}
              <Panel defaultSize={35} minSize={20} className="bg-[#1e1e1e] flex flex-col overflow-hidden border-t border-[#333]">
                
                {/* Console Tab Header Bar */}
                <div className="h-9 bg-[#282828] border-b border-[#333] flex items-center justify-between px-3 shrink-0 text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setConsoleTab('testcase')}
                      className={`py-1 font-bold transition border-b-2 ${consoleTab === 'testcase' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                      Testcase
                    </button>

                    <button
                      onClick={() => setConsoleTab('result')}
                      className={`py-1 font-bold transition border-b-2 ${consoleTab === 'result' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                      Test Result
                    </button>
                  </div>
                </div>

                {/* Console Body Content */}
                <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-zinc-200 space-y-4">
                  
                  {consoleTab === 'testcase' && (
                    <div className="space-y-4">
                      {/* Case Tabs: Case 1 | Case 2 | Case 3 */}
                      <div className="flex items-center justify-between border-b border-[#333] pb-2">
                        <div className="flex items-center gap-2">
                          {testCases.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveCaseIdx(idx)}
                              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                              activeCaseIdx === idx ? 'bg-[#383838] text-white border border-[#555]' : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                        100+ Verified Test Cases Available
                      </span>
                    </div>

                    {/* Separate Input Box & Separate Expected Output Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SEPARATE INPUT BOX */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-cyan-300 font-bold flex items-center justify-between">
                          <span>Input:</span>
                          <span className="text-[10px] text-zinc-400 font-normal">Editable Parameters</span>
                        </label>
                        <textarea
                          rows={4}
                          aria-label="Test Case Input Parameters"
                          value={testCases[activeCaseIdx]?.input || ""}
                            onChange={(e) => {
                              const updated = [...testCases];
                              updated[activeCaseIdx] = { ...updated[activeCaseIdx], input: e.target.value };
                              setTestCases(updated);
                            }}
                            className="w-full bg-[#141414] border border-[#333] rounded-xl p-3 text-xs text-amber-300 font-mono outline-none focus:border-cyan-500 resize-none shadow-inner"
                          />
                        </div>

                        {/* SEPARATE EXPECTED OUTPUT BOX */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-emerald-400 font-bold block">Expected Output:</label>
                          <div className="w-full h-[106px] bg-[#141414] border border-[#333] rounded-xl p-3 text-xs text-emerald-300 font-mono overflow-y-auto shadow-inner">
                            {testCases[activeCaseIdx]?.expectedOutput || "[0,1]"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {consoleTab === 'result' && (
                    <div className="space-y-3">
                      {submissionPhase === 'pending' || submissionPhase === 'judging' ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                           <span className="text-zinc-400 font-bold text-sm tracking-wide">
                              {submissionPhase === 'pending' ? 'Pending...' : 'Judging...'}
                           </span>
                        </div>
                      ) : submissionPhase === 'animating' ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6">
                           <span className="text-blue-400 font-bold text-lg tracking-wide">Judging...</span>
                           <div className="w-full max-w-md bg-[#252525] rounded-full h-3 border border-[#333] overflow-hidden relative">
                              <div 
                                 className="h-full bg-blue-500 transition-all duration-75 ease-linear"
                                 style={{ width: `${Math.max(5, (animatedPassedCount / Math.max(1, totalCasesCount)) * 100)}%` }}
                              />
                           </div>
                           <div className="font-mono text-zinc-300 font-bold">
                              {animatedPassedCount} / {totalCasesCount} Test Cases Passed
                           </div>
                        </div>
                      ) : isRunning ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                           <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                           <span className="text-zinc-400 font-bold">Executing code...</span>
                        </div>
                      ) : output ? (
                        output.error ? (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 space-y-2">
                            <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Execution / Runtime Error</div>
                            <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono pt-1">{output.error}</pre>
                          </div>
                        ) : output.compile_error ? (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 space-y-2">
                            <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Compilation Error</div>
                            <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono pt-1">{output.compile_error}</pre>
                          </div>
                        ) : (output.status || output.result) ? (
                          <div className="space-y-4">
                            <div className={`flex items-center justify-between p-3 rounded-xl border ${(output.status || output.result) === 'Accepted' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                              <span className={`text-base font-extrabold flex items-center gap-2 ${(output.status || output.result) === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(output.status || output.result) === 'Accepted' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />} {(output.status || output.result)}
                              </span>
                              <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4 text-xs font-mono text-zinc-300">
                                {output.execution_time_ms !== undefined && <span>Runtime: <strong className="text-white">{output.execution_time_ms} ms</strong></span>}
                                {output.runtime_ms !== undefined && <span>Runtime: <strong className="text-white">{output.runtime_ms} ms</strong></span>}
                                {output.memory_kb !== undefined && <span>Memory: <strong className="text-white">{(output.memory_kb / 1024).toFixed(1)} MB</strong></span>}
                                {(output.passed !== undefined && output.total !== undefined && output.total > 0) && <span className={(output.status || output.result) === 'Accepted' ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{output.passed} / {output.total} Test Cases Passed</span>}
                              </div>
                            </div>

                            {/* SEPARATE BOXES FOR RESULT (SHOW FAILED CASE IF SUBMITTED OR FIRST CASE IF RUN) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                              <div className="p-3 rounded-xl bg-[#141414] border border-[#333] space-y-1">
                                <div className="text-[11px] font-bold text-zinc-400">Input Box:</div>
                                <div className="text-amber-300 font-mono whitespace-pre-wrap break-all">
                                   {failedCaseIndex >= 0 ? output.cases?.[failedCaseIndex]?.input : (output.cases?.[0]?.input || testCases[activeCaseIdx]?.input || "")}
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-[#141414] border border-[#333] space-y-1">
                                <div className="text-[11px] font-bold text-zinc-400">Your Output Box:</div>
                                <div className="text-cyan-300 font-mono whitespace-pre-wrap break-all">
                                   {failedCaseIndex >= 0 ? output.cases?.[failedCaseIndex]?.output : (output.cases?.[0]?.output || output.output || "")}
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-[#141414] border border-[#333] space-y-1">
                                <div className="text-[11px] font-bold text-emerald-400">Expected Output Box:</div>
                                <div className="text-emerald-300 font-mono whitespace-pre-wrap break-all">
                                   {failedCaseIndex >= 0 ? output.cases?.[failedCaseIndex]?.expectedOutput : (output.cases?.[0]?.expectedOutput || testCases[activeCaseIdx]?.expectedOutput || "")}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-zinc-800 text-zinc-300 font-mono text-sm whitespace-pre-wrap">
                            {JSON.stringify(output, null, 2)}
                          </div>
                        )
                      ) : (
                        <div className="text-zinc-400 py-4">Click &quot;Run&quot; or &quot;Submit&quot; to execute code.</div>
                      )}
                    </div>
                  )}

                </div>

              </Panel>

            </PanelGroup>

          </Panel>

        </PanelGroup>
      </div>

    </div>
  );
}

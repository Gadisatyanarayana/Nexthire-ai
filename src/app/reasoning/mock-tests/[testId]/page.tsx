"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, Bookmark, ChevronLeft, ChevronRight, CheckCircle, Flag, AlertCircle } from "lucide-react";
import { ReasoningQuestion } from "@/models/reasoning";

type QuestionStatus = "unvisited" | "visited" | "answered" | "marked";

export default function TimedAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<ReasoningQuestion[]>([]);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [responses, setResponses] = useState<Record<string, number | null>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [startTimeMs, setStartTimeMs] = useState<Record<string, number>>({});
  const [timeSpentMs, setTimeSpentMs] = useState<Record<string, number>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    async function loadTest() {
      try {
        const res = await fetch(`/api/v1/reasoning/mock-tests/${testId}`);
        const data = await res.json();
        if (data.success) {
          setSession(data.data.session);
          setQuestions(data.data.questions);
          
          const config = data.data.session.session_data.config;
          setTimeLeft(config.duration_minutes * 60);

          // Initialize statuses
          const initialStatuses: Record<string, QuestionStatus> = {};
          const initialResponses: Record<string, number | null> = {};
          data.data.questions.forEach((q: any) => {
            initialStatuses[q.id] = "unvisited";
            initialResponses[q.id] = null;
          });
          if (data.data.questions.length > 0) {
            initialStatuses[data.data.questions[0].id] = "visited";
          }
          setStatuses(initialStatuses);
          setResponses(initialResponses);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  // Global Timer and per-question time tracking
  useEffect(() => {
    if (!loading && questions.length > 0 && !submitting) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });

        // Track time spent on current question
        const qId = questions[currentIdx].id as string;
        setTimeSpentMs(prev => ({
          ...prev,
          [qId]: (prev[qId] || 0) + delta
        }));

      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions, currentIdx, submitting]);

  const handleNavigate = (idx: number, overrideStatus?: QuestionStatus) => {
    if (idx < 0 || idx >= questions.length) return;
    
    // Mark current as visited if not answered/marked
    const currentQId = questions[currentIdx].id as string;
    setStatuses(prev => {
      if (overrideStatus) {
        return { ...prev, [currentQId]: overrideStatus };
      }
      if (prev[currentQId] === "unvisited" || prev[currentQId] === "visited") {
        return { ...prev, [currentQId]: responses[currentQId] !== null ? "answered" : "visited" };
      }
      return prev;
    });

    setCurrentIdx(idx);
    
    // Mark new as visited if unvisited
    const newQId = questions[idx].id as string;
    setStatuses(prev => {
      // If we just marked it, don't overwrite the new q if it happens to be the same (shouldn't be, but safe)
      if (prev[newQId] === "unvisited") {
        return { ...prev, [newQId]: "visited" };
      }
      return prev;
    });
  };

  const handleSelectOption = (oIdx: number) => {
    const qId = questions[currentIdx].id as string;
    setResponses(prev => ({ ...prev, [qId]: oIdx }));
    setStatuses(prev => ({ ...prev, [qId]: "answered" }));
  };

  const handleMarkReview = () => {
    handleNavigate(currentIdx + 1, "marked");
  };

  const handleClearResponse = () => {
    const qId = questions[currentIdx].id as string;
    setResponses(prev => ({ ...prev, [qId]: null }));
    setStatuses(prev => ({ ...prev, [qId]: "visited" }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    const submissionsPayload = questions.map(q => {
      const qId = q.id as string;
      const selected = responses[qId];
      const correctIdx = q.correct_index || 0;
      return {
        question_id: qId,
        selected_option: selected,
        is_correct: selected === correctIdx,
        time_taken_ms: timeSpentMs[qId] || 0,
        difficulty: q.difficulty || "medium",
        topic_id: q.lesson_id // maps to topic_id
      };
    });

    try {
      const res = await fetch("/api/v1/reasoning/mock-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: testId,
          submissions: submissionsPayload
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/reasoning/mock-tests/${testId}/results`);
      } else {
        alert("Failed to submit test: " + data.error);
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  }

  if (questions.length === 0) {
    return <div className="min-h-screen bg-zinc-950 text-white flex justify-center items-center">Test not found or no questions.</div>;
  }

  const q = questions[currentIdx];
  const qId = q.id as string;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 shrink-0">
        <h1 className="font-bold hidden md:block">{session.session_data.config.title}</h1>
        
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-emerald-500'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => {
            if(confirm("Are you sure you want to submit the test?")) handleSubmit();
          }}
          disabled={submitting}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition"
        >
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-zinc-300">Question {currentIdx + 1}</span>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 capitalize">{q.difficulty}</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-10 text-lg leading-relaxed">
            {q.question}
          </div>

          <div className="space-y-4 max-w-3xl">
            {q.options?.map((opt, oIdx) => {
              const isSelected = responses[qId] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(oIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-500/10 text-white' 
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="inline-block w-8 font-bold text-zinc-500">{String.fromCharCode(65 + oIdx)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-8 flex items-center justify-between border-t border-zinc-800">
            <div className="flex gap-3">
              <button 
                onClick={handleMarkReview}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition"
              >
                <Flag className="w-4 h-4 text-orange-400" /> Mark for Review
              </button>
              <button 
                onClick={handleClearResponse}
                disabled={responses[qId] === null}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                Clear Response
              </button>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => handleNavigate(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button 
                onClick={() => handleNavigate(currentIdx + 1)}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Palette */}
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
          <h3 className="font-bold text-white mb-6">Question Palette</h3>
          
          <div className="grid grid-cols-5 gap-2 mb-8">
            {questions.map((q, idx) => {
              const qIdForStatus = q.id as string;
              const status = statuses[qIdForStatus];
              let bgClass = "bg-zinc-800 text-zinc-400 border-transparent";
              if (status === "visited") bgClass = "bg-red-500/20 text-red-400 border-red-500/50";
              if (status === "answered") bgClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
              if (status === "marked") bgClass = "bg-orange-500/20 text-orange-400 border-orange-500/50";
              
              const isCurrent = currentIdx === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => handleNavigate(idx)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${bgClass} ${isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-auto space-y-3 text-sm">
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/50"></div> <span className="text-zinc-400">Answered</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50"></div> <span className="text-zinc-400">Not Answered</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/50"></div> <span className="text-zinc-400">Marked for Review</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-zinc-800"></div> <span className="text-zinc-400">Not Visited</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

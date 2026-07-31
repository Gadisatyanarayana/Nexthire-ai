"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, ChevronLeft, ChevronRight, CheckCircle, Flag } from "lucide-react";
import { VerbalQuestion } from "@/models/verbal";

type QuestionStatus = "unvisited" | "visited" | "answered" | "marked";

export default function VerbalTimedAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<VerbalQuestion[]>([]);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [responses, setResponses] = useState<Record<string, number | null>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadTest() {
      try {
        const res = await fetch(`/api/v1/verbal/mock-tests/${testId}`);
        const data = await res.json();
        if (data.success) {
          setSession(data.data.session);
          setQuestions(data.data.questions);
          
          const config = data.data.session.session_data.config;
          setTimeLeft((config.duration_minutes || 30) * 60);

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

  useEffect(() => {
    if (!loading && questions.length > 0 && !submitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions, submitting]);

  const handleNavigate = (idx: number, overrideStatus?: QuestionStatus) => {
    if (idx < 0 || idx >= questions.length) return;
    
    const currentQId = questions[currentIdx].id as string;
    setStatuses(prev => {
      if (overrideStatus) return { ...prev, [currentQId]: overrideStatus };
      if (prev[currentQId] === "unvisited" || prev[currentQId] === "visited") {
        return { ...prev, [currentQId]: responses[currentQId] !== null ? "answered" : "visited" };
      }
      return prev;
    });

    setCurrentIdx(idx);
    const newQId = questions[idx].id as string;
    setStatuses(prev => prev[newQId] === "unvisited" ? { ...prev, [newQId]: "visited" } : prev);
  };

  const handleSelectOption = (oIdx: number) => {
    const qId = questions[currentIdx].id as string;
    setResponses(prev => ({ ...prev, [qId]: oIdx }));
    setStatuses(prev => ({ ...prev, [qId]: "answered" }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    alert("Assessment completed successfully!");
    router.push("/verbal");
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  if (questions.length === 0) {
    return <div className="min-h-screen bg-black text-white flex justify-center items-center">Test not found or no questions.</div>;
  }

  const q = questions[currentIdx];
  const qId = q.id as string;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between px-6 shrink-0">
        <h1 className="font-bold hidden md:block">{session?.session_data?.config?.title || "Verbal Assessment"}</h1>
        
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-indigo-400'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => {
            if(confirm("Are you sure you want to submit the assessment?")) handleSubmit();
          }}
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition"
        >
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-zinc-300">Question {currentIdx + 1} of {questions.length}</span>
            <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-indigo-400 capitalize font-semibold">{q.difficulty || "medium"}</span>
          </div>

          <div className="text-lg font-medium text-white mb-8 leading-relaxed">
            {q.question}
          </div>

          <div className="space-y-3 mb-10">
            {q.options?.map((opt, oIdx) => {
              const isSelected = responses[qId] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(oIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold' 
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="inline-block w-8 font-bold text-zinc-500">{String.fromCharCode(65 + oIdx)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 flex items-center justify-between border-t border-zinc-800">
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
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50"
            >
              Save & Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

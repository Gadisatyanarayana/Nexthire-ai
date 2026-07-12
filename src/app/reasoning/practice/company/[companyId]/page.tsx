"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReasoningQuestion } from "@/models/reasoning";
import { CheckCircle, XCircle, ArrowLeft, Loader2, HelpCircle, Clock, Lightbulb } from "lucide-react";
import { DifficultyBadge } from "@/components/reasoning/DifficultyBadge";
import Link from "next/link";

export default function AdaptivePracticePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [questions, setQuestions] = useState<ReasoningQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  
  const [hintUsed, setHintUsed] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/v1/reasoning/questions?company_id=${companyId}&limit=15`);
        const data = await res.json();
        if (data.success && data.data) {
          setQuestions(data.data);
          
          // Respect the clicked question ID from URL
          const urlParams = new URLSearchParams(window.location.search);
          const qId = urlParams.get('q');
          if (qId) {
            const idx = data.data.findIndex((q: any) => q.id === qId);
            if (idx !== -1) setCurrentIdx(idx);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [companyId]);

  useEffect(() => {
    if (!loading && questions.length > 0 && !revealed && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeMs(prev => prev + 100);
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions, revealed, isPaused, currentIdx]);

  const handleSelectOption = (oIdx: number) => {
    setSelectedOpt(oIdx);
  };

  const handleSubmit = async (conf: number) => {
    if (selectedOpt === null) return;
    
    setConfidence(conf);
    setRevealed(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentIdx];
    const isCorrect = selectedOpt === (q.correct_index || 0);

    // Sync to backend via Adaptive Learning & SM-2 endpoint
    fetch('/api/v1/reasoning/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: q.id,
        is_correct: isCorrect,
        time_taken_ms: timeMs,
        topic_id: q.lesson_id,
        difficulty: q.difficulty || "medium",
        hint_used: hintUsed,
        confidence_score: conf
      })
    }).catch(console.error);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setRevealed(false);
      setSelectedOpt(null);
      setConfidence(null);
      setHintUsed(false);
      setTimeMs(0);
      setIsPaused(false);
    } else {
      router.push(`/reasoning/company/${companyId}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">No adaptive questions available.</h2>
        <button onClick={() => router.back()} className="px-6 py-2 bg-zinc-800 rounded-lg">Go Back</button>
      </div>
    );
  }

  const q = questions[currentIdx];
  const correctIdx = q.correct_index || 0;
  const isCorrect = selectedOpt === correctIdx;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 pb-32">
        <header className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
          <div>
            <button onClick={() => router.back()} className="text-zinc-400 hover:text-white flex items-center gap-2 mb-4 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Exit Practice
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-emerald-500" />
              Adaptive Practice
            </h1>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="text-zinc-400 font-mono flex items-center gap-2">
              <Clock className="w-4 h-4" /> {(timeMs / 1000).toFixed(1)}s
            </div>
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </header>

        {isPaused ? (
          <div className="text-center py-20 text-zinc-400">
            Session paused. Timer stopped.
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-zinc-800 px-3 py-1 rounded text-sm font-semibold text-zinc-300">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <DifficultyBadge difficulty={q.difficulty} />
            </div>

            <p className="text-lg font-medium text-white mb-4 leading-relaxed">
              {q.question}
            </p>
            
            {q.reasoning_company_tags && q.reasoning_company_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {(q.reasoning_company_tags as any[]).map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase rounded-md border border-blue-500/20">
                    {tag.company_name}
                  </span>
                ))}
              </div>
            )}

            <div className="grid gap-3 mb-6">
              {q.options?.map((opt, oIdx) => {
                let borderClass = "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300";
                
                if (revealed) {
                  if (oIdx === correctIdx) {
                    borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                  } else if (selectedOpt === oIdx) {
                    borderClass = "border-red-500 bg-red-500/10 text-red-400";
                  } else {
                    borderClass = "border-zinc-800 bg-zinc-900/50 opacity-50";
                  }
                } else if (selectedOpt === oIdx) {
                  borderClass = "border-emerald-500/50 bg-zinc-800 text-white";
                }

                return (
                  <button
                    key={oIdx}
                    disabled={revealed}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`text-left p-4 rounded-xl border transition-all ${borderClass}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {!revealed && (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-zinc-800 pt-6 mt-6">
                <button 
                  onClick={() => setHintUsed(true)}
                  disabled={hintUsed}
                  className={`flex items-center gap-2 text-sm ${hintUsed ? 'text-zinc-500' : 'text-yellow-500 hover:text-yellow-400'}`}
                >
                  <Lightbulb className="w-4 h-4" /> 
                  {hintUsed ? "Hint penalty applied" : "Use Hint (-50% mastery)"}
                </button>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-zinc-400">Select confidence to submit:</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => handleSubmit(lvl)}
                        disabled={selectedOpt === null}
                        className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all ${
                          selectedOpt === null 
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                            : 'bg-zinc-700 text-white hover:bg-emerald-500 hover:text-black'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {revealed && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-5 rounded-xl border border-zinc-700 bg-zinc-800/30 mb-6">
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    {isCorrect ? (
                      <span className="text-emerald-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Correct!</span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-2"><XCircle className="w-5 h-5" /> Incorrect</span>
                    )}
                  </div>
                  {q.explanation && (
                    <p className="text-zinc-400 text-sm mt-2">{q.explanation}</p>
                  )}
                  {hintUsed && !isCorrect && (
                    <p className="text-yellow-500/80 text-xs mt-2 italic">Hint penalty waived due to incorrect answer.</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleNext}
                    className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                  >
                    {currentIdx < questions.length - 1 ? "Next Question" : "Complete Session"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

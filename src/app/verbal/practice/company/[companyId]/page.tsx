"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AptitudeQuestion } from "@/models/aptitude";
import { CheckCircle, XCircle, ArrowLeft, Loader2, Clock, Lightbulb } from "lucide-react";
import Link from "next/link";
import { getFallbackQuestionsForLesson } from "@/lib/learning/fallbackQuestions";

export default function VerbalCompanyAdaptivePracticePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = (params.companyId as string) || "tcs";

  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/v1/verbal/questions?company_id=${companyId}&limit=15`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setQuestions(data.data);
        } else {
          setQuestions(getFallbackQuestionsForLesson("rc-fact-based", "verbal", 15) as any);
        }
      } catch (e) {
        console.error(e);
        setQuestions(getFallbackQuestionsForLesson("rc-fact-based", "verbal", 15) as any);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [companyId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeMs(prev => prev + 1000);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx]);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (index: number) => {
    if (revealed) return;
    setSelectedOpt(index);
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setRevealed(false);
      setSelectedOpt(null);
      setTimeMs(0);
    } else {
      router.push(`/verbal/company/${companyId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <Link href={`/verbal/company/${companyId}`} className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-indigo-400 transition">
            <ArrowLeft className="w-4 h-4" /> Exit {companyId.toUpperCase()} Practice
          </Link>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {Math.floor(timeMs / 1000)}s
            </span>
            <span className="bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              {companyId.toUpperCase()} Question {currentIdx + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md">
                {companyId.toUpperCase()} Target Pattern
              </span>
            </div>

            <h2 className="text-xl font-bold text-white leading-relaxed">
              {currentQ.question}
            </h2>

            {/* Options Grid */}
            <div className="space-y-3 pt-2">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                const isCorrect = idx === currentQ.correct_index;
                
                let btnStyle = "bg-zinc-800/60 border-zinc-700 hover:border-indigo-500 text-zinc-200";
                if (revealed) {
                  if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                  else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-300 font-bold";
                  else btnStyle = "bg-zinc-900 border-zinc-800 text-zinc-500 opacity-60";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={revealed}
                    className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </span>
                    {revealed && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation Box */}
            {revealed && (
              <div className="mt-6 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Lightbulb className="w-4 h-4" /> {companyId.toUpperCase()} Examiner Tip & Solution
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {currentQ.explanation || "Answer derived using core subject-verb agreement and vocabulary rules."}
                </p>
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition"
                  >
                    {currentIdx < questions.length - 1 ? "Next Question →" : `Finish ${companyId.toUpperCase()} Practice`}
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

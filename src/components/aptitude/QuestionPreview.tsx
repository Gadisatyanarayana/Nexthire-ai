"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { AptitudeQuestion } from "@/models/aptitude";

export function QuestionPreview({ lessonId, questions }: { lessonId: string, questions: AptitudeQuestion[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!questions || questions.length === 0) return null;

  const displayed = showAll ? questions : questions.slice(0, 4);

  return (
    <div className="mt-12 border-t border-zinc-800 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-500" />
          Practice Questions ({questions.length})
        </h3>
        <Link 
          href={`/aptitude/practice/${lessonId}`}
          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-medium"
        >
          Open Practice Studio <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {displayed.map((q, idx) => {
          const qId = q.id as string;
          return (
            <Link 
              key={qId || idx}
              href={`/aptitude/practice/${lessonId}?q=${qId}`}
              className="p-5 bg-zinc-900/90 rounded-xl border border-zinc-800 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-zinc-800 text-emerald-400 rounded-md">
                      Q{idx + 1}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold ${
                      q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                      q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {q.difficulty || "medium"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 rounded">
                    50+ Hidden Testcases
                  </span>
                </div>
                <p className="text-zinc-200 text-sm font-medium line-clamp-3 leading-relaxed">{q.question}</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/60">
                <span className="text-indigo-400 font-semibold truncate max-w-[200px]">
                  {Array.isArray(q.companies) && q.companies.length > 0 ? q.companies.join(", ") : "TCS NQT, Infosys, Wipro"}
                </span>
                <span className="group-hover:text-emerald-400 transition-colors flex items-center gap-1 font-semibold shrink-0">
                  Solve Question <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {questions.length > 4 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
          >
            {showAll ? (
              <>Show Less (4 Questions) <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Show All {questions.length} Questions <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

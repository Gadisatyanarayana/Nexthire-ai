"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, Zap, Briefcase, HelpCircle, Eye } from "lucide-react";

interface InteractivePracticeQuestionProps {
  id: string;
  idx: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty?: string;
  companies?: string[];
}

export function InteractivePracticeQuestion({
  id,
  idx,
  question,
  options,
  correctIndex,
  explanation,
  difficulty = "medium",
  companies = ["TCS NQT", "Infosys"]
}: InteractivePracticeQuestionProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);

  const handleSelect = (optIdx: number) => {
    if (revealed) return;
    setSelectedIdx(optIdx);
    setRevealed(true);
  };

  const isCorrect = selectedIdx === correctIndex;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition-all shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
            Q{idx + 1}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 capitalize">
            {difficulty}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {companies.length > 0 ? companies.join(", ") : "TCS NQT, Infosys"}
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400/80 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40">
          Hidden Test Cases: 50/50 Passed
        </span>
      </div>

      <p className="text-base font-medium text-white mb-5 leading-relaxed">
        {question}
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {options.map((opt, optIdx) => {
          let optionStyle = "bg-black/40 border-zinc-800 hover:border-emerald-500/40 text-zinc-300 cursor-pointer";
          
          if (revealed) {
            if (optIdx === correctIndex) {
              optionStyle = "bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-semibold";
            } else if (optIdx === selectedIdx) {
              optionStyle = "bg-rose-500/15 border-rose-500/60 text-rose-300 font-semibold";
            } else {
              optionStyle = "bg-black/20 border-zinc-800/40 text-zinc-500 opacity-60 cursor-not-allowed";
            }
          }

          return (
            <button
              key={optIdx}
              onClick={() => handleSelect(optIdx)}
              disabled={revealed}
              className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between text-left transition-all ${optionStyle}`}
            >
              <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
              {revealed && optIdx === correctIndex && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {revealed && optIdx === selectedIdx && optIdx !== correctIndex && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <div className="flex justify-end">
          <button
            onClick={() => setRevealed(true)}
            className="text-xs font-semibold text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors py-1 px-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800"
          >
            <Eye className="w-3.5 h-3.5" /> Reveal Answer & Solution
          </button>
        </div>
      ) : (
        explanation && (
          <div className="mt-4 p-4 rounded-xl bg-black/60 border border-zinc-800/80 text-sm animate-in fade-in duration-300">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Solution & Step-by-Step Explanation:
            </div>
            <p className="text-zinc-300 leading-relaxed">{explanation}</p>
          </div>
        )
      )}
    </div>
  );
}

"use client";

import React from "react";
import { AlertCircle, LogOut, ArrowRight } from "lucide-react";

type ExitConfirmationProps = {
  questionsAnswered: number;
  timeSpentStr: string;
  onCancel: () => void;
  onConfirm: () => void;
  isSaving?: boolean;
};

export function ExitConfirmation({ questionsAnswered, timeSpentStr, onCancel, onConfirm, isSaving }: ExitConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-red-500/20 bg-zinc-950 p-6 md:p-8 shadow-2xl text-center relative animate-scale-in">
        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-red-200 mb-2">Abandon Session?</h3>
        <p className="text-xs text-foreground/60 leading-relaxed mb-6">
          Exiting will abandon the active placement simulation. You can choose to end now and calculate scores for answered questions, or discard progress.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left mb-6 border border-white/5 bg-white/5 p-4 rounded-2xl">
          <div>
            <span className="text-[10px] text-foreground/45 block uppercase font-bold">Time Active</span>
            <span className="text-xs font-black text-white">{timeSpentStr}</span>
          </div>
          <div>
            <span className="text-[10px] text-foreground/45 block uppercase font-bold">Answered</span>
            <span className="text-xs font-black text-white">{questionsAnswered} Questions</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className={`w-full inline-flex items-center justify-center gap-1.5 rounded-2xl py-3.5 text-xs font-extrabold transition-all ${
              isSaving ? "bg-red-500/50 text-black/50 cursor-not-allowed" : "bg-red-500 hover:bg-red-400 text-black"
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Abandon and End mock"}</span>
          </button>
          
          <button
            onClick={onCancel}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-3.5 text-xs font-extrabold transition-all"
          >
            <span>Resume Interview</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

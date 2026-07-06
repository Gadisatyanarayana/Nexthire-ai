"use client";

import React from "react";

type InterviewProgressProps = {
  current: number;
  total: number;
};

export function InterviewProgress({ current, total }: InterviewProgressProps) {
  const percent = Math.round((current / Math.max(1, total)) * 100);

  return (
    <div className="w-full space-y-1.5 p-4 rounded-2xl border border-white/5 bg-white/5">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-foreground/40">
        <span>Interview Completion</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

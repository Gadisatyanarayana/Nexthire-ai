"use client";

import React from "react";
import { Clock } from "lucide-react";

type InterviewTimerProps = {
  timeRemaining: number; // in seconds
  totalDuration: number; // in seconds
  currentQuestion: number;
  totalQuestions: number;
};

export function InterviewTimer({ timeRemaining, totalDuration, currentQuestion, totalQuestions }: InterviewTimerProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Circular progress math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, timeRemaining / totalDuration));
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Change color at warning thresholds
  let progressColor = "stroke-cyan-400";
  let textColor = "text-cyan-400";
  let ringBg = "border-cyan-500/10";
  
  if (timeRemaining < 60) {
    progressColor = "stroke-red-500";
    textColor = "text-red-500 animate-pulse";
    ringBg = "border-red-500/10";
  } else if (timeRemaining < 180) {
    progressColor = "stroke-amber-500";
    textColor = "text-amber-500";
    ringBg = "border-amber-500/10";
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl">
      <div className="relative h-20 w-20 flex items-center justify-center">
        {/* SVG Progress Ring */}
        <svg className="absolute inset-0 h-full w-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-white/5"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`transition-all duration-1000 ease-linear ${progressColor}`}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`text-[13px] font-black tracking-tighter z-10 ${textColor}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-foreground/40">
          <Clock className="h-3 w-3" /> Time Remaining
        </div>
        <div className="text-xs font-black">
          Question {currentQuestion} <span className="text-foreground/40">/ {totalQuestions}</span>
        </div>
      </div>
    </div>
  );
}

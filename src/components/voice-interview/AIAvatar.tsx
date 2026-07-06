"use client";

import React from "react";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

type AIAvatarProps = {
  state: AvatarState;
  personaLabel?: string;
};

export function AIAvatar({ state, personaLabel = "AI Recruiter" }: AIAvatarProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative h-44 w-44 flex items-center justify-center">
        {/* Animated breathing pulse ring */}
        {state === "idle" && (
          <div className="absolute inset-0 rounded-full bg-cyan-500/5 animate-pulse duration-[3000ms] scale-110 border border-cyan-500/10" />
        )}

        {/* Dynamic rippling rings for Listening state */}
        {state === "listening" && (
          <>
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping duration-[2000ms] border border-emerald-500/20" />
            <div className="absolute inset-2 rounded-full bg-emerald-500/5 animate-pulse duration-[1000ms]" />
          </>
        )}

        {/* Orbit spinner rings for Thinking state */}
        {state === "thinking" && (
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 animate-spin duration-[8000ms]" />
        )}

        {/* Expanding glowing bars for Speaking state */}
        {state === "speaking" && (
          <div className="absolute inset-0 rounded-full bg-cyan-500/5 border border-cyan-500/10 animate-pulse duration-[1500ms]" />
        )}

        {/* Core Orb */}
        <div 
          className={`h-32 w-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 border ${
            state === "listening"
              ? "bg-gradient-to-tr from-emerald-950/80 to-teal-900/60 border-emerald-500/30 text-emerald-400"
              : state === "thinking"
              ? "bg-gradient-to-tr from-zinc-900/80 to-cyan-950/50 border-cyan-500/30 text-cyan-400"
              : state === "speaking"
              ? "bg-gradient-to-tr from-cyan-900/80 to-slate-900/60 border-cyan-400/40 text-cyan-300"
              : "bg-gradient-to-tr from-zinc-900/80 to-zinc-950/90 border-white/10 text-white/60"
          }`}
        >
          {/* Inner details of the orb */}
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              {state === "idle" ? "Standby" : state}
            </span>
            <div className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${
                state === "listening"
                  ? "bg-emerald-400 animate-pulse"
                  : state === "thinking"
                  ? "bg-cyan-400 animate-spin"
                  : state === "speaking"
                  ? "bg-cyan-300 animate-bounce"
                  : "bg-white/40"
              }`} />
              <span className="text-xs font-black tracking-tight">{personaLabel}</span>
            </div>
          </div>

          {/* Core glow effects */}
          <div className={`absolute inset-4 rounded-full transition-opacity duration-500 ${
            state === "listening"
              ? "bg-emerald-500/10 filter blur-md opacity-100"
              : state === "thinking"
              ? "bg-cyan-500/10 filter blur-md opacity-100 animate-pulse"
              : state === "speaking"
              ? "bg-cyan-400/20 filter blur-lg opacity-100"
              : "opacity-20 bg-white/5"
          }`} />
        </div>
      </div>
    </div>
  );
}

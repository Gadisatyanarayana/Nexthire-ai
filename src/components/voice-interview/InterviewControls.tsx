"use client";

import React, { useEffect, useState } from "react";
import { Mic, MicOff, Play, Pause, LogOut, Maximize2, Minimize2 } from "lucide-react";

type InterviewControlsProps = {
  isMuted: boolean;
  onMuteToggle: () => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onExit: () => void;
};

export function InterviewControls({ isMuted, onMuteToggle, isPaused, onPauseToggle, onExit }: InterviewControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Error attempting to exit fullscreen:", err);
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5 justify-center items-center p-3 rounded-2xl border border-white/5 bg-white/5 w-full">
      {/* Mic toggle */}
      <button
        onClick={onMuteToggle}
        className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
          isMuted
            ? "border-red-500/20 bg-red-500/10 text-red-400"
            : "border-white/10 bg-zinc-900 text-white hover:bg-white/5"
        }`}
        aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {isMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
      </button>

      {/* Pause / Resume */}
      <button
        onClick={onPauseToggle}
        className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
          isPaused
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-white/10 bg-zinc-900 text-white hover:bg-white/5"
        }`}
        aria-label={isPaused ? "Resume Mock Round" : "Pause Mock Round"}
      >
        {isPaused ? <Play className="h-4.5 w-4.5" /> : <Pause className="h-4.5 w-4.5" />}
        <span>{isPaused ? "Resume" : "Pause"}</span>
      </button>

      {/* Fullscreen control */}
      <button
        onClick={toggleFullscreen}
        className="p-3 rounded-xl border border-white/10 bg-zinc-900 text-white hover:bg-white/5 transition-all flex items-center justify-center"
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
      </button>

      {/* Divider */}
      <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />

      {/* Exit Mock interview */}
      <button
        onClick={onExit}
        className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
        aria-label="Exit Mock interview Session"
      >
        <LogOut className="h-4.5 w-4.5" />
        <span>Exit Session</span>
      </button>
    </div>
  );
}

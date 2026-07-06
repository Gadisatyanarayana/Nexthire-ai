"use client";

import React, { useState, useEffect } from "react";
import { X, Volume2, VolumeX, MessageSquare } from "lucide-react";

export type ReplayMessage = {
  role: "user" | "ai" | "system";
  content: string;
  timestamp: number;
};

type InterviewReplayProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transcript: ReplayMessage[];
  score: number;
  feedback?: string;
};

export function InterviewReplay({ isOpen, onClose, title, transcript, score, feedback }: InterviewReplayProps) {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSynth(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  if (!isOpen) return null;

  const handleSpeak = (text: string, index: number) => {
    if (!synth) return;

    if (speakingIndex === index) {
      synth.cancel();
      setSpeakingIndex(null);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setSpeakingIndex(null);
    };
    utterance.onerror = () => {
      setSpeakingIndex(null);
    };
    setSpeakingIndex(index);
    synth.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl h-[85vh] rounded-3xl border border-white/10 bg-zinc-950 flex flex-col shadow-2xl relative animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">Interview Replay</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className="text-center">
              <div className="text-[10px] uppercase text-foreground/50 font-bold">Overall Score</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{score}/100</div>
            </div>
            <div className="text-center col-span-2 border-l border-white/5 pl-4 text-left flex flex-col justify-center">
              <div className="text-[10px] uppercase text-foreground/50 font-bold mb-0.5">Final Review</div>
              <p className="text-[11px] text-foreground/80 leading-snug line-clamp-2">
                {feedback || "Detailed category breakdown and strengths/weaknesses are available in your analytics tab."}
              </p>
            </div>
          </div>

          {/* Transcript Dialogue */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <span>Full Transcript Dialogue</span>
            </h4>

            {transcript.length === 0 ? (
              <div className="text-center py-8 text-xs text-foreground/40">
                No dialogue tracks recorded for this session.
              </div>
            ) : (
              <div className="space-y-4">
                {transcript.map((msg, idx) => {
                  const isAi = msg.role === "ai";
                  const isSpeaking = speakingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      {/* Bubble content */}
                      <div className={`p-4 rounded-3xl border text-xs leading-relaxed transition-all relative group ${isAi ? "bg-white/5 border-white/5 rounded-tl-sm text-foreground/90" : "bg-cyan-500/10 border-cyan-500/10 text-cyan-100 rounded-tr-sm"}`}>
                        
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <span className="text-[9px] uppercase tracking-wider font-black opacity-40">
                            {isAi ? "AI INTERVIEWER" : "YOUR RESPONSE"}
                          </span>
                          
                          {/* Speak button for TTS */}
                          <button
                            onClick={() => handleSpeak(msg.content, idx)}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-foreground/60 hover:text-white"
                            title={isSpeaking ? "Stop Playback" : "Speak Text"}
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white transition-all"
          >
            Close Replay
          </button>
        </div>
      </div>
    </div>
  );
}

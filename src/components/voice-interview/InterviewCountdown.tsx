"use client";

import React, { useEffect, useState } from "react";

type CountdownProps = {
  onComplete: () => void;
};

export function InterviewCountdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Play a short tone helper
    const playTickTone = (freq: number) => {
      try {
         
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // Fallback silently if audio context is blocked
      }
    };

    playTickTone(count === 1 ? 880 : 440);

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 0;
        }
        playTickTone(prev - 1 === 1 ? 880 : 440);
        setScale(0.8);
        setTimeout(() => setScale(1), 50);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [count, onComplete]);

  if (count === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fade-in select-none">
      <div 
        className="text-center transition-all duration-300 transform"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="text-[120px] md:text-[180px] font-extrabold tracking-tighter text-cyan-400 leading-none">
          {count}
        </div>
        <div className="text-xs uppercase font-extrabold tracking-widest text-foreground/40 mt-4 animate-pulse">
          Mock Interview Starting...
        </div>
      </div>
    </div>
  );
}

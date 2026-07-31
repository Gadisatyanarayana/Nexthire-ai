"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export function FormulaVisualizer({ steps, title }: { steps: string[], title?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const safeSteps = Array.isArray(steps) && steps.length > 0 ? steps : [
    "Define variables and initial conditions.",
    "Formulate governing algebraic relationship.",
    "Apply inverse scaling and unit normalization.",
    "Simplify expression to derive shortcut formula."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= safeSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, safeSteps.length]);

  const handlePlay = () => {
    if (currentStep >= safeSteps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentStep < safeSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden mt-6 shadow-md">
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="font-semibold text-zinc-200 text-xs md:text-sm uppercase tracking-wider">
            {title || "Interactive Step-by-Step Derivation"}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={handlePlay} 
            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
            title={isPlaying ? "Pause" : "Play Step-by-Step"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleNext}
            disabled={currentStep === safeSteps.length - 1}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={handleReset} 
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-all ml-1"
            title="Reset Derivation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[180px] relative bg-gradient-to-b from-zinc-950 to-black">
        <div className="w-full max-w-2xl text-center">
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">
            Step {currentStep + 1} of {safeSteps.length}
          </div>
          
          <div className="text-base md:text-lg font-medium text-zinc-100 min-h-[60px] flex items-center justify-center leading-relaxed transition-all duration-300">
            {safeSteps[currentStep]}
          </div>

          <div className="flex gap-2 justify-center mt-6">
            {safeSteps.map((_, i) => (
              <button 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep 
                    ? 'w-8 bg-emerald-500' 
                    : i < currentStep 
                    ? 'w-2 bg-emerald-700/60' 
                    : 'w-2 bg-zinc-800 hover:bg-zinc-700'
                }`}
                onClick={() => {
                  setCurrentStep(i);
                  setIsPlaying(false);
                }}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

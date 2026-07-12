"use client";

import React, { useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export function FormulaVisualizer({ steps, title }: { steps: string[], title?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Minimal interactive visualizer logic
  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    // Real implementation would use interval or requestAnimationFrame
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
        <h4 className="font-semibold text-zinc-200 text-sm">{title || "Visualization"}</h4>
        <div className="flex gap-2">
          <button onClick={handleReset} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={handlePlay} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 transition-colors">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="p-8 flex items-center justify-center min-h-[200px] relative">
        {/* Placeholder for complex canvas/svg animation */}
        <div className="text-center">
          <div className="text-2xl font-mono text-emerald-400 mb-4 transition-all duration-500">
            {steps[currentStep] || steps[0]}
          </div>
          <div className="flex gap-1 justify-center">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-emerald-500' : 'w-2 bg-zinc-700 cursor-pointer hover:bg-zinc-600'}`}
                onClick={() => setCurrentStep(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

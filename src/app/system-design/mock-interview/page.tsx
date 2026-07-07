"use client";

import { Mic, Video, Play } from "lucide-react";

export default function MockInterviewSetupPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Mic className="h-8 w-8 text-rose-500" />
          AI Mock Interviews
        </h1>
        <p className="text-sm opacity-70 mt-2">
          Simulate high-pressure FAANG System Design rounds. The AI will evaluate your architecture, push back on your tradeoffs, and score your performance based on real rubrics.
        </p>
      </section>

      <div className="p-8 text-center rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/5">
        <Video className="h-12 w-12 mx-auto text-rose-500/50 mb-4" />
        <h2 className="text-xl font-bold">Interactive Audio/Video Mocks Coming in Phase 4</h2>
        <p className="text-sm opacity-70 mt-2 max-w-lg mx-auto mb-6">
          The System Design module is currently in Phase 1 (Architecture). The AI Mock Interview engine will be deployed following the completion of the Adaptive MCQ engine.
        </p>
        <button disabled className="bg-rose-500/50 text-white px-6 py-3 rounded-lg font-bold cursor-not-allowed inline-flex items-center gap-2">
          <Play className="h-4 w-4" fill="currentColor"/> Start Simulation
        </button>
      </div>

    </div>
  );
}

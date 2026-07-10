"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Target, Key, Compass, Navigation, CheckCircle } from "lucide-react";

export function HintOverlay({ question, options, correctOption, topic }: any) {
  const [hints, setHints] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState(0);

  const loadHints = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/aptitude/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options, correctOption, topic })
      });
      const result = await res.json();
      if (result.success) {
        setHints(result.data);
        setLevel(1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (lvl: number) => {
    switch (lvl) {
      case 1: return <Target className="w-5 h-5 text-indigo-400"/>;
      case 2: return <Key className="w-5 h-5 text-purple-400"/>;
      case 3: return <Compass className="w-5 h-5 text-blue-400"/>;
      case 4: return <Navigation className="w-5 h-5 text-emerald-400"/>;
      case 5: return <CheckCircle className="w-5 h-5 text-emerald-500"/>;
      default: return <Sparkles className="w-5 h-5 text-indigo-400"/>;
    }
  };

  if (!hints && !loading) {
    return (
      <button 
        onClick={loadHints}
        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition"
      >
        <Sparkles className="w-4 h-4"/> Stuck? Get an AI Hint
      </button>
    );
  }

  if (loading) {
    return <span className="text-sm text-zinc-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Generating Hints...</span>;
  }

  return (
    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 mt-6 space-y-4">
      <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3 mb-4">
        <h4 className="font-bold text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Progressive AI Hints
        </h4>
        <span className="text-xs font-mono text-zinc-500">Level {level} of 5</span>
      </div>

      <div className="space-y-4">
        {level >= 1 && (
          <div className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5">{getIcon(1)}</div>
            <div>
              <div className="font-bold text-zinc-300 mb-1">Concept Hint</div>
              <div className="text-zinc-400">{hints.level1}</div>
            </div>
          </div>
        )}
        {level >= 2 && (
          <div className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5">{getIcon(2)}</div>
            <div>
              <div className="font-bold text-zinc-300 mb-1">Formula Hint</div>
              <div className="text-zinc-400">{hints.level2}</div>
            </div>
          </div>
        )}
        {level >= 3 && (
          <div className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5">{getIcon(3)}</div>
            <div>
              <div className="font-bold text-zinc-300 mb-1">Direction Hint</div>
              <div className="text-zinc-400">{hints.level3}</div>
            </div>
          </div>
        )}
        {level >= 4 && (
          <div className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5">{getIcon(4)}</div>
            <div>
              <div className="font-bold text-zinc-300 mb-1">Worked Step</div>
              <div className="text-zinc-400">{hints.level4}</div>
            </div>
          </div>
        )}
        {level >= 5 && (
          <div className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5">{getIcon(5)}</div>
            <div>
              <div className="font-bold text-emerald-400 mb-1">Complete Solution</div>
              <div className="text-zinc-300">{hints.level5}</div>
            </div>
          </div>
        )}
      </div>

      {level < 5 && (
        <button 
          onClick={() => setLevel(l => l + 1)}
          className="w-full mt-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-semibold transition"
        >
          Reveal Next Hint (Reduces Mastery Score)
        </button>
      )}
    </div>
  );
}

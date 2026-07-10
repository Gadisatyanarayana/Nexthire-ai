"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, BookOpen, Key, AlertTriangle, Lightbulb } from "lucide-react";

export function FormulaExplainer({ formulaName, context }: { formulaName: string, context?: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadExplanation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/aptitude/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulaName, context })
      });
      const result = await res.json();
      if (result.success) setData(result.data);
      else setError(result.error);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading) {
    return (
      <button 
        onClick={loadExplanation}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition text-sm font-semibold"
      >
        <Sparkles className="w-4 h-4" /> Explain this Formula with AI
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> AI is generating an explanation...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl">{error}</div>;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-4">
      <div className="bg-indigo-500/10 border-b border-zinc-800 p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h4 className="font-bold text-indigo-400">AI Formula Breakdown</h4>
      </div>
      <div className="p-5 space-y-6">
        <div>
          <h5 className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-2"><BookOpen className="w-4 h-4 text-zinc-500"/> Concept</h5>
          <p className="text-zinc-400 text-sm leading-relaxed">{data.explanation}</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-2"><Key className="w-4 h-4 text-emerald-500"/> Memory Trick</h5>
            <p className="text-emerald-400 text-sm leading-relaxed bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">{data.memoryTrick}</p>
          </div>
          <div>
            <h5 className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-2"><AlertTriangle className="w-4 h-4 text-orange-500"/> Common Mistakes</h5>
            <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
              {data.commonMistakes?.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h5 className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-2"><Lightbulb className="w-4 h-4 text-yellow-500"/> Interview Trick</h5>
          <p className="text-zinc-400 text-sm leading-relaxed">{data.interviewTrick}</p>
        </div>
      </div>
    </div>
  );
}

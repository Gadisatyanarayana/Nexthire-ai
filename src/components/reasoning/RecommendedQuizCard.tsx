"use client";

import React, { useState, useEffect } from "react";
import { PlayCircle, Loader2, Target, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";

export function RecommendedQuizCard() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadQuizConfig() {
      try {
        const res = await fetch("/api/v1/reasoning/ai/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preference: { focus: "weak_topics", length: "10" } })
        });
        const data = await res.json();
        if (data.success) setConfig(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadQuizConfig();
  }, []);

  const startQuiz = async () => {
    setGenerating(true);
    try {
      // In a full implementation this would pass the config to the mock engine generator
      const res = await fetch("/api/v1/reasoning/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_config: config })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/reasoning/mock-tests/${data.data.session_id}`);
      }
    } catch (e) {
      console.error(e);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <BrainCircuit className="w-32 h-32 text-indigo-500" />
      </div>

      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2 relative z-10">
        <BrainCircuit className="w-6 h-6 text-indigo-500" />
        AI Custom Quiz
      </h3>
      <p className="text-sm text-zinc-400 mb-6 relative z-10">
        Targeting {config.topics?.join(", ") || "your weak areas"}.
      </p>

      <div className="flex gap-4 mb-6 relative z-10">
        <div className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300">
          {config.numQuestions} Questions
        </div>
        <div className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 capitalize">
          {config.focus?.replace('_', ' ')}
        </div>
      </div>

      <button 
        onClick={startQuiz}
        disabled={generating}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 relative z-10"
      >
        {generating ? <Loader2 className="w-5 h-5 animate-spin"/> : <PlayCircle className="w-5 h-5"/>}
        Start {config.numQuestions}Q Quiz
      </button>
    </div>
  );
}

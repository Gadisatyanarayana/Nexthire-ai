"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, ThumbsUp, AlertCircle, BookOpen, Clock } from "lucide-react";

export function AIReviewCard({ sessionId, initialData }: { sessionId: string, initialData?: any }) {
  const [review, setReview] = useState<any>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;
    
    async function fetchReview() {
      try {
        const res = await fetch("/api/v1/reasoning/ai/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        if (data.success) setReview(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReview();
  }, [sessionId, initialData]);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="text-zinc-400 font-semibold">AI is analyzing your performance...</span>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h3 className="font-bold text-white">AI Post-Session Review</h3>
          <p className="text-xs text-purple-400">Personalized feedback on your attempt</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
          <h4 className="flex items-center gap-2 font-bold text-emerald-400 mb-3">
            <ThumbsUp className="w-4 h-4" /> Strengths
          </h4>
          <ul className="space-y-2">
            {review.strengths?.map((item: string, i: number) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
          <h4 className="flex items-center gap-2 font-bold text-red-400 mb-3">
            <AlertCircle className="w-4 h-4" /> Areas for Improvement
          </h4>
          <ul className="space-y-2">
            {review.weaknesses?.map((item: string, i: number) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="md:col-span-2 bg-blue-500/5 border border-blue-500/10 rounded-xl p-5">
          <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-3">
            <BookOpen className="w-4 h-4" /> Actionable Next Steps
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              {review.suggestions?.map((item: string, i: number) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
              <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Time Management
              </h5>
              <p className="text-sm text-zinc-300 leading-relaxed">{review.timeManagement}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

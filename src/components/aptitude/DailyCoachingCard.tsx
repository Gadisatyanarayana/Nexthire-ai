"use client";

import React, { useState, useEffect } from "react";
import { Bot, Loader2, Target, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export function DailyCoachingCard() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch("/api/v1/aptitude/ai/coach");
        const data = await res.json();
        if (data.success) setPlan(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, []);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-20">
        <Bot className="w-24 h-24 text-emerald-500" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Bot className="w-6 h-6 text-emerald-500" />
          AI Daily Coaching Plan
        </h3>
        <p className="text-emerald-400/80 text-sm mb-6 max-w-lg leading-relaxed">
          {plan.summary}
        </p>

        <div className="space-y-3 mb-6">
          {plan.dailyPlan?.map((step: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3 bg-zinc-950/50 p-3 rounded-xl border border-emerald-500/10">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <span className="text-zinc-300 text-sm">{step}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href={plan.recommendedRoute || "/aptitude"} className="px-4 py-2 bg-emerald-500 text-black font-bold text-sm rounded-lg hover:bg-emerald-400 transition flex items-center gap-2">
            Start Learning <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

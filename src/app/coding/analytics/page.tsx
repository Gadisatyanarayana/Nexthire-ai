'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Sparkles, PieChart, BarChart3, ShieldCheck, Flame } from 'lucide-react';
import { CODING_TOPICS } from '@/lib/codingMetadata';

export default function CodingAnalyticsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/coding" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-emerald-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Coding Arena
        </Link>

        {/* Header */}
        <header className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            Performance Analytics
          </span>
          <h1 className="text-4xl font-extrabold text-white">Skill Tree & Pattern Mastery Dashboard</h1>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Real-time analytics on pattern mastery, topic coverage, company readiness score, and weak topic identification.
          </p>
        </header>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Elo Rating</span>
            <p className="text-3xl font-black text-emerald-400">1650 Elo</p>
            <p className="text-[11px] text-zinc-500">Competitive placement readiness tier</p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Submissions</span>
            <p className="text-3xl font-black text-white">124 Solved</p>
            <p className="text-[11px] text-zinc-500">Across 18 canonical DSA patterns</p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Strongest Pattern</span>
            <p className="text-3xl font-black text-amber-400">Sliding Window</p>
            <p className="text-[11px] text-zinc-500">92% accuracy rate</p>
          </div>
        </div>

        {/* Topic Skill Trees */}
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Topic Mastery Distribution
          </h3>

          <div className="space-y-3">
            {CODING_TOPICS.slice(0, 8).map((t, idx) => {
              const pct = Math.max(15, 90 - idx * 10);
              return (
                <div key={t} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white">{t}</span>
                    <span className="text-emerald-400 font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

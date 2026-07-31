'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, Sparkles, Clock, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { LEARNING_TRACKS } from '@/lib/codingMetadata';

export default function LearningTracksPage() {
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
            Curated Career Tracks
          </span>
          <h1 className="text-4xl font-extrabold text-white">Placement & Interview Learning Paths</h1>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Targeted problem sequences designed specifically for product companies, service drives, and intensive placement refreshers.
          </p>
        </header>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEARNING_TRACKS.map((track) => (
            <div key={track.id} className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-black border border-zinc-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {track.estimatedDays} Days Roadmap
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{track.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{track.targetAudience}</p>

              <div className="space-y-2 pt-2">
                <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Key Topics Covered</h5>
                <div className="flex flex-wrap gap-1.5">
                  {track.topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-black text-zinc-300 text-[11px] font-semibold border border-zinc-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/coding?track=${encodeURIComponent(track.id)}`}
                className="mt-4 w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-2"
              >
                Start Track ({Array.isArray((track as any).problemIds) ? (track as any).problemIds.length : 50}+ Problems) <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

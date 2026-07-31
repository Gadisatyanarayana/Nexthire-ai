'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitFork, Sparkles, Layers, BookOpen, ChevronRight } from 'lucide-react';
import { CODING_TOPICS } from '@/lib/codingMetadata';

export default function KnowledgeGraphPage() {
  const [activeTopic, setActiveTopic] = useState('Arrays');

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/coding" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-emerald-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Coding Arena
        </Link>

        {/* Header */}
        <header className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            Interactive Knowledge Graph
          </span>
          <h1 className="text-4xl font-extrabold text-white">Visual DSA DAG & Concept Map</h1>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Explore relationships between topics, solving patterns, and prerequisite problem nodes.
          </p>
        </header>

        {/* Knowledge Graph Explorer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Topics Selector Sidebar */}
          <div className="md:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2">Domains & Topics</h3>
            {CODING_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTopic(t)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTopic === t ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                <span>{t}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Interactive Node Graph Content */}
          <div className="md:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">Selected Node</span>
                <h2 className="text-2xl font-bold text-white">{activeTopic} Knowledge Graph</h2>
              </div>
              <Link
                href={`/coding/topic/${activeTopic.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition"
              >
                Open Deep-Dive Guide
              </Link>
            </div>

            {/* Tree Map Representation */}
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                <span className="text-amber-400 font-bold">{activeTopic} (Root Domain)</span>
                <div className="pl-6 space-y-2 border-l-2 border-zinc-800 text-zinc-300">
                  <div>
                    <span className="text-emerald-400">├── Subtopics</span>
                    <div className="pl-6 space-y-1 text-zinc-400 text-[11px]">
                      <p>├── Searching & Linear Scanning</p>
                      <p>├── Sorting & Two-Pointer Partitioning</p>
                      <p>└── Prefix Sum & Subarray Evaluation</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-emerald-400">└── Primary Solving Patterns</span>
                    <div className="pl-6 space-y-1 text-zinc-400 text-[11px]">
                      <p>├── Two Pointers (O(N) / O(1))</p>
                      <p>├── Sliding Window (O(N) / O(1))</p>
                      <p>└── Binary Search (O(log N) / O(1))</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

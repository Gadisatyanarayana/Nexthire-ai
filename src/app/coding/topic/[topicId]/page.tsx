'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Layers, Code2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import type { QuestionRichMetadata } from '@/lib/codingMetadata';

export default function TopicDeepDivePage() {
  const params = useParams();
  const topicId = String(params.topicId || 'arrays');

  const [data, setData] = useState<{
    topic: string;
    questions: QuestionRichMetadata[];
    subtopics: string[];
    patternDistribution: string[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopic() {
      setLoading(true);
      try {
        const res = await fetch(`/api/coding/metadata?type=topic&topic=${topicId}`);
        const result = await res.json();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTopic();
  }, [topicId]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-12 text-center">Loading Topic Guide...</div>;
  }

  const topicName = data?.topic || topicId.toUpperCase();

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/coding" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-emerald-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Coding Arena
        </Link>

        {/* Topic Header */}
        <header className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Topic Deep-Dive
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-white">{topicName} Domain Guide</h1>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Comprehensive guide for <strong className="text-white">{topicName}</strong> data structures, memory layout, common operations, and pattern relationships.
          </p>

          {/* Subtopics Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {(data?.subtopics || []).map((sub) => (
              <span key={sub} className="px-3 py-1 rounded-xl bg-black border border-zinc-800 text-xs font-semibold text-zinc-300">
                {sub}
              </span>
            ))}
          </div>
        </header>

        {/* Pattern Progression Map for this Topic */}
        <section className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Solving Patterns for {topicName}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data?.patternDistribution || []).map((pat) => (
              <Link
                key={pat}
                href={`/coding/pattern/${pat.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition flex items-center gap-1.5"
              >
                {pat} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </section>

        {/* Problem Questions */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Questions in {topicName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.questions || []).map((q) => (
              <Link
                key={q.id}
                href={`/coding/problem/${q.id}`}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white hover:text-emerald-400 transition">{q.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    q.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                    q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{q.subtopic}</p>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60 font-mono">
                  <span>Pattern: {q.primaryPattern}</span>
                  <span>{q.timeComplexity} / {q.spaceComplexity}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

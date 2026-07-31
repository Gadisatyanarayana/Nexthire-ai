'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, Code2, Sparkles, CheckCircle2, Circle, 
  Lightbulb, AlertCircle, Building2, Flame, Layers 
} from 'lucide-react';
import type { QuestionRichMetadata } from '@/lib/codingMetadata';

export default function PatternRoadmapPage() {
  const params = useParams();
  const patternId = String(params.patternId || 'two-pointers');

  const [data, setData] = useState<{
    pattern: string;
    signal?: { keyword: string; description: string };
    templates?: Record<string, string>;
    questions: QuestionRichMetadata[];
    practiceOrder: { easy: QuestionRichMetadata[]; medium: QuestionRichMetadata[]; hard: QuestionRichMetadata[] };
  } | null>(null);

  const [activeLang, setActiveLang] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPattern() {
      setLoading(true);
      try {
        const res = await fetch(`/api/coding/metadata?type=pattern&pattern=${patternId}`);
        const result = await res.json();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPattern();
  }, [patternId]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-12 text-center">Loading Pattern Roadmap...</div>;
  }

  const patternName = data?.pattern || patternId.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/coding" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-emerald-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Coding Arena
        </Link>

        {/* Pattern Header */}
        <header className="p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-emerald-950/40 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Pattern Roadmap
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-white">{patternName} Roadmap</h1>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Master the canonical <strong className="text-emerald-400">{patternName}</strong> solving pattern. Learn instant recognition keywords, multi-language boilerplate code templates, and complete the progression from Easy to Hard interview challenges.
          </p>

          {data?.signal && (
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Recognition Signal</h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  If the problem text mentions <strong className="text-emerald-400">"{data.signal.keyword}"</strong>, apply the {patternName} pattern: {data.signal.description}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Boilerplate Templates */}
        {data?.templates && (
          <section className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" /> Multi-Language Code Templates
              </h3>

              <div className="flex bg-black border border-zinc-800 rounded-xl p-1 text-xs">
                {(['python', 'cpp', 'java', 'javascript'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                      activeLang === lang ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
              {data.templates[activeLang] || data.templates['python']}
            </pre>
          </section>
        )}

        {/* Practice Progression Order */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" /> Practice Order Progression
          </h2>

          {/* Easy */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">1. Fundamental Warmups (Easy)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data?.practiceOrder.easy || []).map((q) => (
                <Link
                  key={q.id}
                  href={`/coding/problem/${q.id}`}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">{q.title}</h4>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block">{q.subtopic}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">O(n)</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Medium */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">2. Core Interview Problems (Medium)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data?.practiceOrder.medium || []).map((q) => (
                <Link
                  key={q.id}
                  href={`/coding/problem/${q.id}`}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 transition flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition">{q.title}</h4>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block">{q.subtopic}</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold">O(n)</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Hard */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">3. High-Tier Mastery Challenges (Hard)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data?.practiceOrder.hard || []).map((q) => (
                <Link
                  key={q.id}
                  href={`/coding/problem/${q.id}`}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-red-500/40 transition flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition">{q.title}</h4>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block">{q.subtopic}</span>
                  </div>
                  <span className="text-xs font-mono text-red-400 font-bold">O(n)</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

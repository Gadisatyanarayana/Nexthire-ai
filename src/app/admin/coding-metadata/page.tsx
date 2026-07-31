'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Edit3, Save, RefreshCw, Layers, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { CODING_TOPICS, SOLVING_PATTERNS } from '@/lib/codingMetadata';

export default function AdminCodingMetadataPage() {
  const { data: session, status: authStatus } = useSession();
  const isAdmin = session?.user?.email === 'satyanarayanag904@gmail.com';

  const [questionId, setQuestionId] = useState('1');
  const [primaryPattern, setPrimaryPattern] = useState('Two Pointers');
  const [topic, setTopic] = useState('Arrays');
  const [subtopic, setSubtopic] = useState('Searching & Sorting');
  const [companyTags, setCompanyTags] = useState('Amazon, Google, Meta');
  const [timeComplexity, setTimeComplexity] = useState('O(n)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(1)');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/coding/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          primaryPattern,
          topic,
          subtopic,
          companyTags: companyTags.split(',').map(c => c.trim()),
          timeComplexity,
          spaceComplexity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save metadata');

      setMessage('Metadata snapshot saved and audited successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Error saving metadata');
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === 'loading') {
    return <div className="min-h-screen bg-black text-white p-12 text-center">Loading authentication...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Admin Privileges Required</h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-md">
          Metadata CMS is restricted exclusively to administrator <span className="text-emerald-400 font-mono">satyanarayanag904@gmail.com</span>.
        </p>
        <Link href="/coding" className="mt-6 px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700">
          Back to Coding Arena
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        {/* Header */}
        <header className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            Metadata Management CMS
          </span>
          <h1 className="text-3xl font-extrabold text-white">Coding Question Metadata Editor</h1>
          <p className="text-zinc-400 text-xs">
            Edit Primary Patterns, Subtopics, Target Companies, and Time/Space Complexity without touching challenge starter code or test cases.
          </p>
        </header>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Target Question ID</label>
              <input
                type="text"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Primary Solving Pattern</label>
              <select
                value={primaryPattern}
                onChange={(e) => setPrimaryPattern(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                {SOLVING_PATTERNS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Primary Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                {CODING_TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Subtopic Breakdown</label>
              <input
                type="text"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Time Complexity</label>
              <input
                type="text"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Space Complexity</label>
              <input
                type="text"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">Target Companies (Comma-separated)</label>
            <input
              type="text"
              value={companyTags}
              onChange={(e) => setCompanyTags(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Snapshot...' : 'Save & Audit Metadata'}
          </button>
        </form>

      </div>
    </div>
  );
}

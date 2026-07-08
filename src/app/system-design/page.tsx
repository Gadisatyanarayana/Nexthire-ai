"use client";

import Link from "next/link";
import { Target, Flame, TrendingUp, CheckCircle, Activity, Play } from "lucide-react";
import KnowledgeGraph from "@/components/system-design/KnowledgeGraph";

export default function SystemDesignDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight">System Design Dashboard</h1>
        <p className="text-sm opacity-70 mt-1">
          Master the fundamentals of distributed systems and prepare for FAANG-level interviews.
        </p>
      </section>

      {/* Analytics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-foreground/10 bg-foreground/5 space-y-2">
          <div className="flex items-center gap-2 opacity-70">
            <Target className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Placement Readiness</h3>
          </div>
          <p className="text-3xl font-bold text-cyan-500">12%</p>
          <p className="text-xs opacity-60">Based on MCQ accuracy and mock performance.</p>
        </div>

        <div className="p-4 rounded-xl border border-foreground/10 bg-foreground/5 space-y-2">
          <div className="flex items-center gap-2 opacity-70">
            <Flame className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Study Streak</h3>
          </div>
          <p className="text-3xl font-bold text-amber-500">5 Days</p>
          <p className="text-xs opacity-60">You&apos;re on a roll! Keep learning.</p>
        </div>

        <div className="p-4 rounded-xl border border-foreground/10 bg-foreground/5 space-y-2">
          <div className="flex items-center gap-2 opacity-70">
            <CheckCircle className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Modules Completed</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-500">0 / 12</p>
          <p className="text-xs opacity-60">Start your first module today.</p>
        </div>

        <div className="p-4 rounded-xl border border-foreground/10 bg-foreground/5 space-y-2">
          <div className="flex items-center gap-2 opacity-70">
            <Activity className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Weak Topics</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">Networking</p>
          <p className="text-xs opacity-60">Focus here to improve your score.</p>
        </div>
      </section>

      {/* Topic Mastery Heatmap / Knowledge Graph */}
      <section className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            Topic Mastery Map & Knowledge Graph
          </h2>
          <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md font-semibold">Beta</span>
        </div>
        <KnowledgeGraph />
      </section>

      {/* Recommended Next Lesson */}
      <section className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-500 mb-2">Recommended Next Lesson</h2>
        <h3 className="text-2xl font-bold mb-1">Level 1: Foundations - Vertical vs Horizontal Scaling</h3>
        <p className="text-sm opacity-70 max-w-2xl mb-6">
          Start your journey by understanding the physical bounds of vertical scaling and the structural requirements for distributed horizontal scaling.
        </p>
        <Link 
          href="/system-design/mod-foundations/scalability"
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-3 rounded-lg font-bold transition-colors"
        >
          <Play className="h-4 w-4" fill="currentColor" />
          Start Lesson
        </Link>
      </section>

    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Zap, BookOpen, ArrowRight, Activity, Lock, CheckCircle2 } from "lucide-react";
import { getModules, getServerUserId, getUserTopicMastery } from "@/lib/api/verbalV2";
import { LessonProgress } from "@/components/aptitude/LessonProgress";
import { LearningService } from "@/lib/learning/services/LearningService";
import { BackButton } from "@/components/BackButton";
const { KnowledgeGraphEngine } = LearningService;

export const revalidate = 3600;

export default async function VerbalHubPage() {
  const modules = await getModules();
  const userId = await getServerUserId();
  let mastery: any[] = [];
  let allLessons: any[] = [];
  
  if (userId) {
    mastery = await getUserTopicMastery(userId);
  }
  
  try {
    const { getAllLessons } = await import("@/lib/api/verbalV2");
    allLessons = await getAllLessons();
  } catch (e) {
    console.error("Failed to fetch all lessons", e);
  }

  const totalLessons = allLessons.length > 0 ? allLessons.length : modules.reduce((acc, m) => acc + ((m as any).apt_lessons?.length || 4), 0);
  const completedLessons = mastery.filter(m => m.mastery_score >= 80).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
        
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BackButton fallback="/" />
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl flex items-center gap-3">
                <BookOpen className="h-10 w-10 text-emerald-500" />
                Verbal Ability
              </h1>
              <p className="mt-3 text-lg text-zinc-400 max-w-2xl">
                Master reading comprehension, grammar, and vocabulary through our structured curriculum.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/verbal/company"
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 px-6 py-3 text-sm font-semibold transition"
            >
              Company Prep
            </Link>
            <Link
              href="/verbal/mock-tests"
              className="rounded-xl border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-6 py-3 text-sm font-semibold transition"
            >
              Mock Tests
            </Link>
          </div>
        </header>

        {/* Dashboard Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:col-span-3 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Overall Verbal Progress</h3>
                <p className="text-zinc-400 text-sm">Target 80%+ accuracy for MNC placement cutoffs</p>
              </div>
            </div>
            <LessonProgress completed={completedLessons} total={totalLessons} />
          </div>
        </div>

        {/* Modules Grid with Lock System */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Verbal Ability Modules
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const locked = false;

              return (
                <div key={module.id} className="relative">
                  <Link 
                    href={`/learn/verbal-ability/${module.id}`}
                    className="block group relative bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 cursor-pointer rounded-2xl p-6 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-zinc-800 text-indigo-400">
                          Level {module.level_order}
                        </span>
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        {module.title}
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {module.description}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

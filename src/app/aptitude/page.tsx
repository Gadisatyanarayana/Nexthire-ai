import React from "react";
import Link from "next/link";
import { Zap, BookOpen, ArrowRight, Activity, Clock, AlertTriangle } from "lucide-react";
import { getModules, getServerUserId, getUserTopicMastery } from "@/lib/api/aptitudeV2";
import { LessonProgress } from "@/components/aptitude/LessonProgress";
import { SearchButton } from "@/components/aptitude/SearchButton";
import { RevisionList } from "@/components/aptitude/RevisionList";
import { WeakTopicsList } from "@/components/aptitude/WeakTopicsList";
import { AITutorWidget } from "@/components/aptitude/AITutorWidget";
import { ContinueLearningCard } from "@/components/aptitude/ContinueLearningCard";
import { StudyPlanCard } from "@/components/aptitude/StudyPlanCard";
import { RecommendedQuizCard } from "@/components/aptitude/RecommendedQuizCard";
import { LearningService } from "@/lib/learning/services/LearningService";
const { KnowledgeGraphEngine } = LearningService;

export const revalidate = 3600;

export default async function AptitudeHubPage() {
  const modules = await getModules();
  
  const userId = await getServerUserId();
  let mastery: any[] = [];
  let allLessons: any[] = [];
  
  if (userId) {
    mastery = await getUserTopicMastery(userId);
  }
  
  // We need lessons for the progress and continue learning
  try {
    const { getAllLessons } = await import("@/lib/api/aptitudeV2");
    allLessons = await getAllLessons();
  } catch (e) {
    console.error("Failed to fetch all lessons", e);
  }

  const totalLessons = allLessons.length > 0 ? allLessons.length : modules.reduce((acc, m) => acc + ((m as any).apt_lessons?.length || 5), 0);
  const completedLessons = mastery.filter(m => m.mastery_score >= 80).length;

  let nextAction = null;
  if (allLessons.length > 0) {
    nextAction = KnowledgeGraphEngine.getNextActionPriority(modules, allLessons, mastery);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
        
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl flex items-center gap-3">
              <Zap className="h-10 w-10 text-emerald-500" />
              Aptitude Hub
            </h1>
            <p className="mt-3 text-lg text-zinc-400 max-w-2xl">
              Master quantitative reasoning, logical deduction, and verbal ability through our structured curriculum.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <SearchButton />
            <Link
              href="/aptitude/company"
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 px-6 py-3 text-sm font-semibold transition"
            >
              Company Prep
            </Link>
            <Link
              href="/aptitude/mock-tests"
              className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-3 text-sm font-semibold transition"
            >
              Mock Tests
            </Link>
          </div>
        </header>

        {nextAction && (
          <div className="mb-8">
            <ContinueLearningCard action={nextAction} />
          </div>
        )}

        {/* Dashboard Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Main Progress Card (Spans 2 columns on lg) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Overall Progress</h3>
                <p className="text-zinc-400 text-sm">Keep up the momentum!</p>
              </div>
            </div>
            <LessonProgress completed={completedLessons} total={totalLessons} />
          </div>

          {/* Today's Revision */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-bold text-lg">Today's Review</h3>
            </div>
            {userId ? (
              <RevisionList userId={userId} />
            ) : (
              <p className="text-zinc-500 text-sm italic">Sign in to track revisions.</p>
            )}
          </div>
          
          {/* Weak Topics */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-white font-bold text-lg">Topics Needing Attention</h3>
            </div>
            {userId ? (
              <WeakTopicsList userId={userId} />
            ) : (
              <p className="text-zinc-500 text-sm italic">Sign in to analyze weak topics.</p>
            )}
          </div>
        </div>

        {/* AI Coaching Section (Phase 5) */}
        {userId && (
          <div className="mb-12 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-500" />
              AI Intelligent Coaching
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StudyPlanCard />
              </div>
              <div className="space-y-6">
                <RecommendedQuizCard />
              </div>
            </div>
          </div>
        )}

        {/* Modules Grid */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Curriculum Modules
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const { locked } = KnowledgeGraphEngine.isModuleLocked(module.id, modules, allLessons, mastery);

              return (
                <div key={module.id} className="relative">
                  <Link 
                    href={locked ? "#" : `/aptitude/learn/${module.id}`}
                    className={`block group relative bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 transition-all ${
                      locked ? "opacity-60 cursor-not-allowed" : "hover:border-emerald-500/50 hover:bg-zinc-900 cursor-pointer"
                    }`}
                  >
                    {!locked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    )}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 bg-zinc-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider rounded-md">
                          Level {module.level_order}
                        </span>
                        {locked ? (
                          <div className="p-1.5 bg-zinc-800/80 rounded-lg" title="Complete previous level to unlock">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </div>
                        ) : (
                          <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        {module.title}
                        {!locked && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>}
                      </h3>
                      {locked && <p className="text-xs text-red-400 mt-2">Locked: Complete Level {module.level_order - 1} to unlock</p>}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <AITutorWidget />
      </div>
    </div>
  );
}

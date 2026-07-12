import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getModule, getLessonsByModule, getModules, getAllLessons, getServerUserId, getUserTopicMastery } from "@/lib/api/aptitudeV2";
import { KnowledgeGraphEngine } from "@/lib/aptitude/KnowledgeGraphEngine";
import { TopicSidebar } from "@/components/aptitude/TopicSidebar";
import { ContinueLearningCard } from "@/components/aptitude/ContinueLearningCard";
import { BookOpen, CheckSquare } from "lucide-react";
import { DifficultyBadge } from "@/components/aptitude/DifficultyBadge";

export const revalidate = 3600;

export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = await params;
  const [moduleData, lessons, allModules, allLessons, userId] = await Promise.all([
    getModule(resolvedParams.moduleId),
    getLessonsByModule(resolvedParams.moduleId),
    getModules(),
    getAllLessons(),
    getServerUserId()
  ]);

  if (!moduleData) notFound();

  let mastery: any[] = [];
  if (userId) {
    mastery = await getUserTopicMastery(userId);
  }

  const { locked } = KnowledgeGraphEngine.isModuleLocked(moduleData.id, allModules, allLessons, mastery);
  if (locked) {
    redirect("/aptitude");
  }

  // Re-attach lessons to modules for the sidebar
  const sidebarModules = allModules.map(m => ({
    ...m,
    apt_lessons: m.id === moduleData.id ? lessons : []
  }));

  const action = KnowledgeGraphEngine.getNextActionPriority(allModules, allLessons, mastery);

  return (
    <div className="min-h-screen bg-black flex">
      <TopicSidebar modules={sidebarModules as any} currentModuleId={moduleData.id} mastery={mastery} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
          
          <header className="mb-10 border-b border-zinc-800 pb-10">
            <h1 className="text-4xl font-bold text-white mb-4">{moduleData.title}</h1>
          </header>

          {action && (
            <div className="mb-12">
              <ContinueLearningCard action={action} />
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              Module Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-white mb-2">{lessons.length}</span>
                <span className="text-zinc-400 text-sm uppercase tracking-wider font-semibold">Total Lessons</span>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-emerald-500 mb-2">
                  {mastery.filter(m => lessons.some(l => l.id === m.topic_id) && m.mastery_score >= 75).length}
                </span>
                <span className="text-zinc-400 text-sm uppercase tracking-wider font-semibold">Completed</span>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-amber-500 mb-2">
                  {Math.round(
                    (mastery.filter(m => lessons.some(l => l.id === m.topic_id) && m.mastery_score >= 75).length / Math.max(1, lessons.length)) * 100
                  )}%
                </span>
                <span className="text-zinc-400 text-sm uppercase tracking-wider font-semibold">Progress</span>
              </div>
            </div>

            <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-300 leading-relaxed text-center">
                Use the sidebar curriculum to navigate through the lessons. Your progress is saved automatically as you complete the required formulas, practice questions, and achieve mastery in each topic.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

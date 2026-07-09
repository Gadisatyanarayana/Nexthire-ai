import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule, getLessonsByModule, getModules, getServerUserId, getUserTopicMastery } from "@/lib/api/aptitudeV2";
import { TopicSidebar } from "@/components/aptitude/TopicSidebar";
import { ContinueLearningCard } from "@/components/aptitude/ContinueLearningCard";
import { BookOpen, CheckSquare } from "lucide-react";
import { DifficultyBadge } from "@/components/aptitude/DifficultyBadge";

export const revalidate = 3600;

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  const [moduleData, lessons, allModules, userId] = await Promise.all([
    getModule(params.moduleId),
    getLessonsByModule(params.moduleId),
    getModules(),
    getServerUserId()
  ]);

  if (!moduleData) notFound();

  let mastery: any[] = [];
  if (userId) {
    mastery = await getUserTopicMastery(userId);
  }

  // Re-attach lessons to modules for the sidebar
  const sidebarModules = allModules.map(m => ({
    ...m,
    apt_lessons: m.id === moduleData.id ? lessons : [] // Optimization: only fetch lessons for current module, or fetch all if needed
  }));

  const nextLesson = lessons[0]; // Naive continue learning logic

  return (
    <div className="min-h-screen bg-black flex">
      <TopicSidebar modules={sidebarModules as any} currentModuleId={moduleData.id} mastery={mastery} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
          
          <header className="mb-10 border-b border-zinc-800 pb-10">
            <h1 className="text-4xl font-bold text-white mb-4">{moduleData.title}</h1>
          </header>

          {nextLesson && (
            <div className="mb-12">
              <ContinueLearningCard lesson={nextLesson as any} moduleName={moduleData.title} />
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              Module Lessons
            </h2>
            
            <div className="grid gap-4">
              {lessons.map((lesson, idx) => (
                <Link 
                  key={lesson.id}
                  href={`/aptitude/learn/${moduleData.id}/${lesson.id}`}
                  className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-5 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold font-mono group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{lesson.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                        <DifficultyBadge difficulty={lesson.difficulty} />
                        <span>{lesson.reading_time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

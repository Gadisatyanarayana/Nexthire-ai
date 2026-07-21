import React from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle, BookOpen, Clock, Zap, Target } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function ModuleLessonsPage({ params }: { params: { domainId: string, moduleId: string } }) {
  const { domainId, moduleId } = params;
  
  const modules = await LearningService.queries.getModules(domainId);
  const currentModule = modules.find(m => m.id === moduleId);
  
  if (!currentModule) {
    return notFound();
  }

  // Use the legacy facade to fetch lessons for this specific module
  const lessons = await LearningService.queries.getLessonsByModule(moduleId, domainId);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
        
        {/* Navigation */}
        <Link 
          href={`/learn/${domainId}`} 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-emerald-400 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Curriculum
        </Link>

        {/* Header */}
        <header className="mb-12 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-md mb-4 inline-block">
              Module {currentModule.level_order}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white mb-4">
              {currentModule.title}
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
              {currentModule.description}
            </p>
            
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <BookOpen className="w-5 h-5 text-zinc-500" />
                {lessons.length} Lessons
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Target className="w-5 h-5 text-emerald-500" />
                Core Concepts
              </div>
            </div>
          </div>
        </header>

        {/* Lessons List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-emerald-500" />
            Module Lessons
          </h2>
          
          <div className="grid gap-4">
            {lessons.map((lesson, idx) => (
              <Link 
                href={`/learn/${domainId}/${moduleId}/${lesson.id}`}
                key={lesson.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center font-bold text-lg text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 max-w-3xl">
                      {lesson.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        lesson.difficulty === 'beginner' ? 'bg-blue-500/10 text-blue-400' :
                        lesson.difficulty === 'intermediate' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {lesson.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 hidden md:block">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-black transition-colors text-zinc-500">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
            
            {lessons.length === 0 && (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                No lessons populated for this module yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

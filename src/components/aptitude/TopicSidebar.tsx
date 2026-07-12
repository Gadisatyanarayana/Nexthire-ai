import React from "react";
import Link from "next/link";
import { AptitudeModule, AptitudeLesson } from "@/models/aptitude";
import { BookOpen, CheckCircle2, Lock } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";
import { KnowledgeGraphEngine } from "@/lib/aptitude/KnowledgeGraphEngine";

export function TopicSidebar({ 
  modules, 
  currentLessonId,
  currentModuleId,
  mastery = []
}: { 
  modules: (AptitudeModule & { apt_lessons: AptitudeLesson[] })[],
  currentLessonId?: string,
  currentModuleId?: string,
  mastery?: any[]
}) {
  return (
    <div className="w-full lg:w-80 shrink-0 border-r border-zinc-800 bg-black h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:block">
      <div className="p-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          Aptitude Curriculum
        </h2>
        
        <div className="space-y-8">
          {modules.map((module, mIdx) => {
            const allLessons = modules.flatMap(m => m.apt_lessons || []);
            const { locked: isModuleLocked } = KnowledgeGraphEngine.isModuleLocked(
              module.id,
              modules as any,
              allLessons,
              mastery
            );

            return (
            <div key={module.id} className={`space-y-3 ${isModuleLocked ? 'opacity-50' : ''}`}>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                {module.title}
                {isModuleLocked && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
              </h3>
              <div className="space-y-1">
                {module.apt_lessons?.map((lesson, lIdx) => {
                  const isActive = lesson.id === currentLessonId;
                  
                  const lessonMastery = mastery.find(m => m.topic_id === lesson.id);
                  const isCompleted = lessonMastery && lessonMastery.mastery_score >= 75;
                  
                  // Use KnowledgeGraphEngine
                  const allLessons = modules.flatMap(m => m.apt_lessons || []);
                  const { locked: isLessonLevelLocked } = KnowledgeGraphEngine.isLessonLocked(
                    lesson.id,
                    modules as any,
                    allLessons,
                    mastery
                  );
                  const isLocked = isModuleLocked || isLessonLevelLocked;

                  return isLocked ? (
                    <div
                      key={lesson.id}
                      className="flex flex-col p-3 rounded-lg transition-colors border bg-transparent border-transparent opacity-50 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-300 line-clamp-1">
                          {lesson.title}
                        </span>
                        <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2 text-xs">
                          <DifficultyBadge difficulty={lesson.difficulty} />
                          <span className="text-zinc-500">{lesson.reading_time}</span>
                        </div>
                        <span className="text-[10px] text-red-400 font-medium leading-tight">
                          Complete previous topics to unlock
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={lesson.id}
                      href={`/aptitude/learn/${module.id}/${lesson.id}`}
                      className={`
                        flex flex-col p-3 rounded-lg transition-colors border
                        ${isActive 
                          ? 'bg-zinc-800/80 border-emerald-500/30' 
                          : 'bg-transparent border-transparent hover:bg-zinc-900'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                          {lesson.title}
                        </span>
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <DifficultyBadge difficulty={lesson.difficulty} />
                        <span className="text-zinc-500">{lesson.reading_time}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

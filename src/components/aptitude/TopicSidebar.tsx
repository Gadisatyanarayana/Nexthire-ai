import React from "react";
import Link from "next/link";
import { AptitudeModule, AptitudeLesson } from "@/models/aptitude";
import { BookOpen, CheckCircle2, Lock } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";

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
            // A module is unlocked if it's the first module or if previous modules have some progress
            // For now, let's keep all modules unlocked, but we could enforce sequential completion
            return (
            <div key={module.id} className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                {module.title}
              </h3>
              <div className="space-y-1">
                {module.apt_lessons?.map((lesson, lIdx) => {
                  const isActive = lesson.id === currentLessonId;
                  
                  const lessonMastery = mastery.find(m => m.topic_id === lesson.id);
                  const isCompleted = lessonMastery && lessonMastery.mastery_score >= 80;
                  
                  // Naive locking: locked if previous lesson in this module is NOT completed.
                  // Only lock if we actually have lessons array and we are past index 0.
                  const prevLesson = lIdx > 0 ? module.apt_lessons[lIdx - 1] : null;
                  let isLocked = false;
                  if (prevLesson) {
                    const prevMastery = mastery.find(m => m.topic_id === prevLesson.id);
                    isLocked = !prevMastery || prevMastery.mastery_score < 80;
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`/aptitude/learn/${module.id}/${lesson.id}`}
                      className={`
                        flex flex-col p-3 rounded-lg transition-colors border
                        ${isActive 
                          ? 'bg-zinc-800/80 border-emerald-500/30' 
                          : 'bg-transparent border-transparent hover:bg-zinc-900'}
                        ${isLocked ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                          {lesson.title}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                        ) : null}
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

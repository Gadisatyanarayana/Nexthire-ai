import React from "react";
import { notFound } from "next/navigation";
import { getLesson, getModule, getFormulasByLesson, getQuestionPreview, getModules, getServerUserId, getUserTopicMastery } from "@/lib/api/aptitudeV2";
import { TopicSidebar } from "@/components/aptitude/TopicSidebar";
import { LessonViewer } from "@/components/aptitude/LessonViewer";

export const revalidate = 3600;

export default async function LessonPage({ params }: { params: { moduleId: string, lessonId: string } }) {
  const [lesson, moduleData, formulas, questions, allModules, moduleLessons, userId] = await Promise.all([
    getLesson(params.lessonId),
    getModule(params.moduleId),
    getFormulasByLesson(params.lessonId),
    getQuestionPreview(params.lessonId, 4),
    getModules(),
    import("@/lib/api/aptitudeV2").then(m => m.getLessonsByModule(params.moduleId)),
    getServerUserId()
  ]);

  if (!lesson || !moduleData) notFound();

  let mastery: any[] = [];
  if (userId) {
    mastery = await getUserTopicMastery(userId);
  }

  const currentIndex = moduleLessons.findIndex(l => l.id === lesson.id);
  const prevLessonObj = currentIndex > 0 ? moduleLessons[currentIndex - 1] : undefined;
  const nextLessonObj = currentIndex !== -1 && currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : undefined;

  const prevLesson = prevLessonObj ? { id: prevLessonObj.id, title: prevLessonObj.title, moduleId: params.moduleId } : undefined;
  const nextLesson = nextLessonObj ? { id: nextLessonObj.id, title: nextLessonObj.title, moduleId: params.moduleId } : undefined;

  return (
    <div className="min-h-screen bg-black flex">
      <TopicSidebar modules={allModules as any} currentModuleId={moduleData.id} currentLessonId={lesson.id} mastery={mastery} />
      
      <main className="flex-1 overflow-y-auto">
        <LessonViewer 
          lesson={lesson as any} 
          moduleName={moduleData.title} 
          formulas={formulas as any} 
          questions={questions as any}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        />
      </main>
    </div>
  );
}

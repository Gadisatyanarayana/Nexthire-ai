import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getLesson, getModule, getFormulasByLesson, getQuestionPreview, getModules, getServerUserId, getUserTopicMastery } from "@/lib/api/aptitudeV2";
import { TopicSidebar } from "@/components/aptitude/TopicSidebar";
import { LessonViewer } from "@/components/aptitude/LessonViewer";
import { AITutorWidget } from "@/components/aptitude/AITutorWidget";
import { Lock } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
const { KnowledgeGraphEngine } = LearningService;

export const revalidate = 3600;

export default async function LessonPage({ params }: { params: Promise<{ moduleId: string, lessonId: string }> }) {
  const resolvedParams = await params;
  const [lesson, moduleData, formulas, questions, allModules, allLessons, userId] = await Promise.all([
    getLesson(resolvedParams.lessonId),
    getModule(resolvedParams.moduleId),
    getFormulasByLesson(resolvedParams.lessonId),
    getQuestionPreview(resolvedParams.lessonId, 25),
    getModules(),
    import("@/lib/api/aptitudeV2").then(m => m.getAllLessons()),
    getServerUserId()
  ]);

  if (!lesson || !moduleData) notFound();

  let mastery: any[] = [];
  if (userId) {
    mastery = await getUserTopicMastery(userId);
  }

  const { locked, reason, requiredLessonId } = KnowledgeGraphEngine.isLessonLocked(
    lesson.id,
    allModules as any,
    allLessons as any,
    mastery
  );

  const moduleLessons = allLessons.filter(l => l.module_id === resolvedParams.moduleId);
  const currentIndex = moduleLessons.findIndex(l => l.id === lesson.id);
  const prevLessonObj = currentIndex > 0 ? moduleLessons[currentIndex - 1] : undefined;
  const nextLessonObj = currentIndex !== -1 && currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : undefined;

  const prevLesson = prevLessonObj ? { id: prevLessonObj.id, title: prevLessonObj.title, moduleId: resolvedParams.moduleId } : undefined;
  const nextLesson = nextLessonObj ? { id: nextLessonObj.id, title: nextLessonObj.title, moduleId: resolvedParams.moduleId } : undefined;

  return (
    <div className="min-h-screen bg-black flex">
      <main className="flex-1 overflow-y-auto">
        {locked ? (
          redirect(`/aptitude/learn/${resolvedParams.moduleId}`)
        ) : (
          <LessonViewer 
            lesson={lesson as any} 
            moduleName={moduleData.title} 
            formulas={formulas as any} 
            questions={questions as any}
            prevLesson={prevLesson}
            nextLesson={nextLesson}
          />
        )}
        <AITutorWidget initialContext={{
          lessonTitle: lesson.title,
          moduleTitle: moduleData.title,
          masteryScore: mastery.find((m: any) => m.topic_id === lesson.id)?.mastery_score || 0
        }} />
      </main>
    </div>
  );
}

import { LearningService } from "@/lib/learning/services/LearningService";
import { ReasoningModule, ReasoningLesson, ReasoningFormula, ReasoningQuestion } from "../../models/reasoning";

// Legacy Reasoning API facade migrating to LearningService CQRS Query Engine

export async function getServerUserId(): Promise<string | null> {
  return LearningService.queries.getServerUserId();
}

export async function getModules(): Promise<ReasoningModule[]> {
  return LearningService.queries.getModules("reasoning");
}

export async function getModule(id: string): Promise<ReasoningModule | null> {
  return LearningService.queries.getModule(id, "reasoning");
}

export async function getLesson(id: string): Promise<ReasoningLesson | null> {
  return LearningService.queries.getLesson(id, "reasoning");
}

export async function getLessonsByModule(moduleId: string): Promise<ReasoningLesson[]> {
  return LearningService.queries.getLessonsByModule(moduleId, "reasoning");
}

export async function getAllLessons(): Promise<ReasoningLesson[]> {
  return LearningService.queries.getAllLessons("reasoning");
}

export async function getFormula(id: string): Promise<ReasoningFormula | null> {
  return LearningService.queries.getFormula(id, "reasoning");
}

export async function getFormulasByLesson(lessonId: string): Promise<ReasoningFormula[]> {
  return LearningService.queries.getFormulasByLesson(lessonId, "reasoning");
}

export async function getQuestionPreview(lessonId: string, limit: number = 3): Promise<ReasoningQuestion[]> {
  return LearningService.queries.getQuestionPreview(lessonId, limit, "reasoning");
}

export async function getUserTopicMastery(userId: string): Promise<any[]> {
  return LearningService.queries.getUserTopicMastery(userId, "reasoning");
}

export async function getUserRevisionQueue(userId: string): Promise<any[]> {
  return LearningService.queries.getUserRevisionQueue(userId, "reasoning");
}

export async function searchReasoningLessons(query: string): Promise<ReasoningLesson[]> {
  return LearningService.queries.searchReasoningLessons(query);
}

export async function searchReasoningFormulas(query: string): Promise<ReasoningFormula[]> {
  return LearningService.queries.searchReasoningFormulas(query);
}

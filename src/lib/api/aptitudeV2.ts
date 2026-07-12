import { LearningService } from "@/lib/learning/services/LearningService";
import { AptitudeModule, AptitudeLesson, AptitudeFormula, AptitudeQuestion } from "../../models/aptitude";

// Legacy Aptitude API facade migrating to LearningService CQRS Query Engine

export async function getServerUserId(): Promise<string | null> {
  return LearningService.queries.getServerUserId();
}

export async function getModules(): Promise<AptitudeModule[]> {
  return LearningService.queries.getModules();
}

export async function getModule(id: string): Promise<AptitudeModule | null> {
  return LearningService.queries.getModule(id);
}

export async function getLesson(id: string): Promise<AptitudeLesson | null> {
  return LearningService.queries.getLesson(id);
}

export async function getLessonsByModule(moduleId: string): Promise<AptitudeLesson[]> {
  return LearningService.queries.getLessonsByModule(moduleId);
}

export async function getAllLessons(): Promise<AptitudeLesson[]> {
  return LearningService.queries.getAllLessons();
}

export async function getFormula(id: string): Promise<AptitudeFormula | null> {
  return LearningService.queries.getFormula(id);
}

export async function getFormulasByLesson(lessonId: string): Promise<AptitudeFormula[]> {
  return LearningService.queries.getFormulasByLesson(lessonId);
}

export async function getQuestionPreview(lessonId: string, limit: number = 3): Promise<AptitudeQuestion[]> {
  return LearningService.queries.getQuestionPreview(lessonId, limit);
}

export async function getUserTopicMastery(userId: string): Promise<any[]> {
  return LearningService.queries.getUserTopicMastery(userId);
}

export async function getUserRevisionQueue(userId: string): Promise<any[]> {
  return LearningService.queries.getUserRevisionQueue(userId);
}

export async function searchAptitudeLessons(query: string): Promise<AptitudeLesson[]> {
  return LearningService.queries.searchAptitudeLessons(query);
}

export async function searchAptitudeFormulas(query: string): Promise<AptitudeFormula[]> {
  return LearningService.queries.searchAptitudeFormulas(query);
}

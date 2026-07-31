import { LearningService } from "@/lib/learning/services/LearningService";
import { AptitudeModule, AptitudeLesson, AptitudeQuestion } from "@/models/aptitude";

export async function getServerUserId(): Promise<string | null> {
  return LearningService.queries.getServerUserId();
}

export async function getModules(): Promise<AptitudeModule[]> {
  return LearningService.queries.getModules("verbal");
}

export async function getModule(id: string): Promise<AptitudeModule | null> {
  return LearningService.queries.getModule(id, "verbal");
}

export async function getLesson(id: string): Promise<AptitudeLesson | null> {
  return LearningService.queries.getLesson(id, "verbal");
}

export async function getLessonsByModule(moduleId: string): Promise<AptitudeLesson[]> {
  return LearningService.queries.getLessonsByModule(moduleId, "verbal");
}

export async function getAllLessons(): Promise<AptitudeLesson[]> {
  return LearningService.queries.getAllLessons("verbal");
}

export async function getUserTopicMastery(userId: string): Promise<any[]> {
  return LearningService.queries.getUserTopicMastery(userId, "verbal");
}

export async function getFormulasByLesson(lessonId: string): Promise<any[]> {
  return LearningService.queries.getFormulasByLesson(lessonId, "verbal");
}

export async function getQuestionPreview(lessonId: string, limit: number = 3): Promise<AptitudeQuestion[]> {
  return LearningService.queries.getQuestionPreview(lessonId, limit, "verbal");
}

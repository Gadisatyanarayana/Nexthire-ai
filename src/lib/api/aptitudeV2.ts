import { LearningService } from "@/lib/learning/services/LearningService";
import { AptitudeModule, AptitudeLesson, AptitudeFormula, AptitudeQuestion } from "../../models/aptitude";

export async function getServerUserId(): Promise<string | null> {
  try { return await LearningService.queries.getServerUserId(); } catch { return null; }
}

export async function getModules(): Promise<AptitudeModule[]> {
  try { return await LearningService.queries.getModules(); } catch { return []; }
}

export async function getModule(id: string): Promise<AptitudeModule | null> {
  try { return await LearningService.queries.getModule(id); } catch { return null; }
}

export async function getLesson(id: string): Promise<AptitudeLesson | null> {
  try { return await LearningService.queries.getLesson(id); } catch { return null; }
}

export async function getLessonsByModule(moduleId: string): Promise<AptitudeLesson[]> {
  try { return await LearningService.queries.getLessonsByModule(moduleId); } catch { return []; }
}

export async function getAllLessons(): Promise<AptitudeLesson[]> {
  try { return await LearningService.queries.getAllLessons(); } catch { return []; }
}

export async function getFormula(id: string): Promise<AptitudeFormula | null> {
  try { return await LearningService.queries.getFormula(id); } catch { return null; }
}

export async function getFormulasByLesson(lessonId: string): Promise<AptitudeFormula[]> {
  try { return await LearningService.queries.getFormulasByLesson(lessonId); } catch { return []; }
}

export async function getQuestionPreview(lessonId: string, limit: number = 3): Promise<AptitudeQuestion[]> {
  try { return await LearningService.queries.getQuestionPreview(lessonId, limit); } catch { return []; }
}

export async function getUserTopicMastery(userId: string): Promise<any[]> {
  try { return await LearningService.queries.getUserTopicMastery(userId); } catch { return []; }
}

export async function getUserRevisionQueue(userId: string): Promise<any[]> {
  try { return await LearningService.queries.getUserRevisionQueue(userId); } catch { return []; }
}

export async function searchAptitudeLessons(query: string): Promise<AptitudeLesson[]> {
  try { return await LearningService.queries.searchAptitudeLessons(query); } catch { return []; }
}

export async function searchAptitudeFormulas(query: string): Promise<AptitudeFormula[]> {
  try { return await LearningService.queries.searchAptitudeFormulas(query); } catch { return []; }
}

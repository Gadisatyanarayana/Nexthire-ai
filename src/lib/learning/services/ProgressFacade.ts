import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { 
  LearningProgress, 
  UserStats, 
  XPTransaction, 
  LearningSession, 
  ContentTypeEnum, 
  LearningStatusEnum,
  XPSourceEnum,
  LearningEventType
} from "../../../models/progress";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Domain Services

export class GamificationService {
  public static async awardXP(userId: string, tenantId: string, amount: number, source: z.infer<typeof XPSourceEnum>, contentId?: string, description?: string) {
    const repo = RepositoryFactory.getProgressRepository();
    
    // 1. Record Transaction
    const transaction = {
      tenant_id: tenantId,
      user_id: userId,
      amount,
      source_type: source,
      source_id: contentId,
      description
    };
    await repo.recordXPTransaction(transaction);

    // 2. Update Total XP
    let stats = await repo.getUserStats(userId);
    if (!stats) {
      stats = { user_id: userId, tenant_id: tenantId, total_xp: 0, current_streak: 0, longest_streak: 0, current_level: 1 };
    }
    stats.total_xp += amount;
    
    // Simple leveling logic: 100 XP = 1 level
    stats.current_level = Math.floor(stats.total_xp / 100) + 1;
    
    await repo.updateUserStats(stats);
  }
}

export class AnalyticsService {
  public static async logEvent(userId: string, tenantId: string, eventType: z.infer<typeof LearningEventType>, contentType: z.infer<typeof ContentTypeEnum>, contentId: string, metadata: any = {}) {
    const repo = RepositoryFactory.getProgressRepository();
    await repo.logEvent({
      tenant_id: tenantId,
      user_id: userId,
      event_type: eventType,
      content_type: contentType,
      content_id: contentId,
      event_metadata: metadata
    });
  }

  public static async startSession(userId: string, tenantId: string, contentType: z.infer<typeof ContentTypeEnum>, contentId: string): Promise<string> {
    const repo = RepositoryFactory.getProgressRepository();
    const sessionId = uuidv4();
    await repo.startSession({
      id: sessionId,
      tenant_id: tenantId,
      user_id: userId,
      content_type: contentType,
      content_id: contentId
    });
    return sessionId;
  }

  public static async endSession(sessionId: string, durationSeconds: number) {
    const repo = RepositoryFactory.getProgressRepository();
    await repo.endSession(sessionId, durationSeconds);
  }
  
  public static async recordDailyActivity(userId: string, tenantId: string, activeSeconds: number) {
    const repo = RepositoryFactory.getProgressRepository();
    const today = new Date().toISOString().split('T')[0];
    await repo.saveDailyActivity({
      tenant_id: tenantId,
      user_id: userId,
      activity_date: today,
      active_seconds: activeSeconds
    });
  }
}

export class LearningProgressService {
  public static async saveState(userId: string, tenantId: string, contentType: z.infer<typeof ContentTypeEnum>, contentId: string, status: z.infer<typeof LearningStatusEnum>, resumeState: any, activeTimeInc: number) {
    const repo = RepositoryFactory.getProgressRepository();
    
    let progress = await repo.getLearningProgress(userId, contentType, contentId);
    if (!progress) {
      progress = {
        tenant_id: tenantId,
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        status: status,
        resume_state: resumeState,
        active_time_seconds: activeTimeInc
      };
    } else {
      progress.status = status;
      progress.resume_state = { ...progress.resume_state, ...resumeState };
      progress.active_time_seconds += activeTimeInc;
    }
    
    await repo.saveLearningProgress(progress);
  }

  public static async getProgress(userId: string, contentType: z.infer<typeof ContentTypeEnum>, contentId: string) {
    const repo = RepositoryFactory.getProgressRepository();
    return await repo.getLearningProgress(userId, contentType, contentId);
  }
}

// Facade

export class LearningProgressFacade {
  public static async markLessonComplete(userId: string, tenantId: string, lessonId: string, activeTimeInc: number) {
    // 1. Save state
    await LearningProgressService.saveState(userId, tenantId, "LESSON", lessonId, "COMPLETED", {}, activeTimeInc);
    
    // 2. Log Analytics
    await AnalyticsService.logEvent(userId, tenantId, "lesson_completed", "LESSON", lessonId);
    await AnalyticsService.recordDailyActivity(userId, tenantId, activeTimeInc);
    
    // 3. Award XP
    await GamificationService.awardXP(userId, tenantId, 25, "LESSON_COMPLETE", lessonId, "Completed lesson");
  }

  public static async autoSave(userId: string, tenantId: string, lessonId: string, resumeState: any, activeTimeInc: number) {
    await LearningProgressService.saveState(userId, tenantId, "LESSON", lessonId, "IN_PROGRESS", resumeState, activeTimeInc);
    await AnalyticsService.recordDailyActivity(userId, tenantId, activeTimeInc);
  }
  
  public static async getDashboardStats(userId: string) {
    const repo = RepositoryFactory.getProgressRepository();
    const stats = await repo.getUserStats(userId);
    return stats || { total_xp: 0, current_streak: 0, longest_streak: 0, current_level: 1 };
  }
}

import { AptitudeModule, AptitudeLesson, AptitudeTopicMastery } from "@/models/aptitude";

export class KnowledgeGraphEngine {
  /**
   * Evaluates a node's readiness based on required/recommended dependencies and mastery levels.
   */
  public static isLessonLocked(
    lessonId: string,
    allModules: AptitudeModule[],
    allLessons: AptitudeLesson[],
    userMastery: AptitudeTopicMastery[]
  ): { locked: boolean; reason?: string; requiredLessonId?: string } {
    
    const lesson = allLessons.find(l => l.id === lessonId);
    if (!lesson) return { locked: true, reason: "Lesson not found" };

    const moduleStatus = this.isModuleLocked(lesson.module_id, allModules, allLessons, userMastery);
    if (moduleStatus.locked) {
      return {
        locked: true,
        reason: moduleStatus.reason || "Module is locked"
      };
    }

    return { locked: false };
  }

  /**
   * Evaluates if a module is locked.
   * Progression strictly follows Level -> Module.
   * Level 1 is unlocked. Higher levels unlock when user achieves >= 75% mastery in previous level.
   */
  public static isModuleLocked(
    moduleId: string,
    allModules: AptitudeModule[],
    allLessons: AptitudeLesson[],
    userMastery: AptitudeTopicMastery[]
  ): { locked: boolean; reason?: string } {
    const targetModule = allModules.find(m => m.id === moduleId);
    if (!targetModule) return { locked: true, reason: "Module not found" };

    // Level 1 modules are unlocked by default
    if (targetModule.level_order <= 1) {
      return { locked: false };
    }

    const prevLevelModules = allModules.filter(m => m.level_order === targetModule.level_order - 1);
    for (const prevMod of prevLevelModules) {
      const prevModLessons = allLessons.filter(l => l.module_id === prevMod.id);
      if (prevModLessons.length === 0) continue;

      let masteredCount = 0;
      for (const prevLesson of prevModLessons) {
        const mastery = (userMastery || []).find(m => m.topic_id === prevLesson.id);
        if (mastery && mastery.mastery_score >= 75) {
          masteredCount++;
        }
      }

      if (masteredCount < Math.ceil(prevModLessons.length / 2)) {
        return {
          locked: true,
          reason: `Complete Level ${targetModule.level_order - 1} (${prevMod.title}) to unlock.`
        };
      }
    }

    return { locked: false };
  }

  public static getNextActionPriority(
    allModules: AptitudeModule[],
    allLessons: AptitudeLesson[],
    userMastery: AptitudeTopicMastery[]
  ): any {
    const unlockedModules = allModules.filter(m => !this.isModuleLocked(m.id, allModules, allLessons, userMastery).locked);
    const targetModule = unlockedModules[0] || allModules[0];
    const targetLessons = allLessons.filter(l => l.module_id === targetModule?.id);
    const firstUnfinished = targetLessons.find(l => {
      const m = (userMastery || []).find(um => um.topic_id === l.id);
      return !m || m.mastery_score < 75;
    }) || targetLessons[0];

    if (!firstUnfinished) return null;

    return {
      type: "lesson",
      targetId: firstUnfinished.id,
      lessonId: firstUnfinished.id,
      title: firstUnfinished.title,
      moduleId: targetModule.id,
      moduleTitle: targetModule.title,
      reason: "Recommended next step in your curriculum path."
    };
  }

  public static getMasteryLevel(score: number): "novice" | "competent" | "proficient" | "master" {
    if (score >= 90) return "master";
    if (score >= 75) return "proficient";
    if (score >= 60) return "competent";
    return "novice";
  }
}

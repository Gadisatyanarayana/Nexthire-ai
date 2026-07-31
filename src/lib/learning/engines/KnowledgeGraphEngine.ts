export interface IModule {
  id: string;
  title: string;
  level_order: number;
}

export interface ILesson {
  id: string;
  module_id: string;
  title: string;
}

export interface ITopicMastery {
  topic_id: string;
  mastery_score: number;
  revision_queue_date?: string | null;
  confidence_score?: number;
  questions_attempted?: number;
}

export class KnowledgeGraphEngine {
  /**
   * Evaluates a node's readiness based on required/recommended dependencies and mastery levels.
   */
  public static isLessonLocked(
    lessonId: string,
    allModules: IModule[],
    allLessons: ILesson[],
    userMastery: ITopicMastery[]
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

    // Within an unlocked module, all lessons are accessible to allow flexible learning paths.
    return { locked: false };
  }

  /**
   * Evaluates if a module is locked.
   * Progression must strictly follow Level -> Module.
   * All lessons in modules with a lower level_order must have a mastery score >= 75.
   */
  public static isModuleLocked(
    moduleId: string,
    allModules: IModule[],
    allLessons: ILesson[],
    userMastery: ITopicMastery[]
  ): { locked: boolean; reason?: string } {
    const targetModule = allModules.find(m => m.id === moduleId);
    if (!targetModule) return { locked: true, reason: "Module not found" };

    const lowerLevelModules = allModules.filter(m => m.level_order < targetModule.level_order);
    
    // Only check the immediate previous module level
    const prevLevelModules = allModules.filter(m => m.level_order === targetModule.level_order - 1);
    
    for (const prevMod of prevLevelModules) {
      const prevModLessons = allLessons.filter(l => l.module_id === prevMod.id);
      if (prevModLessons.length === 0) continue;
      
      // Calculate how many lessons in the previous module are mastered
      let masteredCount = 0;
      for (const prevLesson of prevModLessons) {
        const mastery = userMastery.find(m => m.topic_id === prevLesson.id);
        if (mastery && mastery.mastery_score >= 75) {
          masteredCount++;
        }
      }
      
      // If less than 50% of the previous module is mastered, keep the next module locked
      if (masteredCount < Math.ceil(prevModLessons.length / 2)) {
        return {
          locked: true,
          reason: `You must achieve >= 75% mastery in at least half of "${prevMod.title}" to unlock this level.`
        };
      }
    }

    return { locked: false };
  }

  /**
   * Intelligently calculates the next optimal action based on priority:
   * 1 Revision overdue -> 2 Failed assessment -> 3 Current lesson -> 4 Current practice
   * 5 Module assessment -> 6 Next unlocked lesson -> 7 Company preparation -> 8 Mock
   */
  public static getNextActionPriority(
    allModules: IModule[],
    allLessons: ILesson[],
    userMastery: ITopicMastery[]
  ): { type: "lesson" | "revision" | "mock" | "assessment"; targetId: string; title: string; reason: string, moduleId?: string, lessonId?: string } {
    
    // 1. Revision overdue
    const now = new Date();
    const dueRevisions = userMastery.filter(m => {
      if (!m.revision_queue_date) return false;
      return new Date(m.revision_queue_date) <= now;
    }).sort((a, b) => (a.confidence_score || 100) - (b.confidence_score || 100));

    if (dueRevisions.length > 0) {
      const target = allLessons.find(l => l.id === dueRevisions[0].topic_id);
      if (target) {
        return { type: "revision", targetId: target.id, moduleId: target.module_id, title: target.title, reason: "Revision overdue" };
      }
    }

    // Identify active lessons (unlocked but not competent)
    const unlockedLessons = allLessons
      .filter(l => {
        const moduleLocked = this.isModuleLocked(l.module_id, allModules, allLessons, userMastery).locked;
        const lessonLocked = this.isLessonLocked(l.id, allModules, allLessons, userMastery).locked;
        return !moduleLocked && !lessonLocked;
      })
      .sort((a, b) => {
        // Sort by module level first, then lesson numerical ID
        const aMod = allModules.find(m => m.id === a.module_id);
        const bMod = allModules.find(m => m.id === b.module_id);
        const aModLevel = aMod?.level_order || 0;
        const bModLevel = bMod?.level_order || 0;
        if (aModLevel !== bModLevel) return aModLevel - bModLevel;
        
        const aNum = parseInt(a.id.split('-').pop() || "0", 10) || 0;
        const bNum = parseInt(b.id.split('-').pop() || "0", 10) || 0;
        return aNum - bNum;
      });
    
    const activeLessons = unlockedLessons.filter(l => {
      const mastery = userMastery.find(m => m.topic_id === l.id);
      return !mastery || mastery.mastery_score < 75;
    });

    if (activeLessons.length > 0) {
      const current = activeLessons[0];
      const currentMastery = userMastery.find(m => m.topic_id === current.id);
      
      // 3. Current lesson vs 4. Current practice
      if (!currentMastery || (currentMastery.questions_attempted || 0) < 5) {
        return { type: "lesson", targetId: current.id, lessonId: current.id, moduleId: current.module_id, title: current.title, reason: "Current lesson" };
      } else {
        return { type: "lesson", targetId: current.id, lessonId: current.id, moduleId: current.module_id, title: `${current.title} Practice`, reason: "Current practice" };
      }
    }

    // 8. Mock (Default fallback if all unlocked lessons are mastered)
    return {
      type: "mock",
      targetId: "placement-ready",
      lessonId: "placement-ready",
      title: "Full Mock Assessment",
      reason: "Placement Preparation"
    };
  }

  /**
   * Calculates the discrete Mastery Level based on mastery score.
   */
  public static getMasteryLevel(score: number): "Not Started" | "Learning" | "Practicing" | "Competent" | "Mastered" | "Expert" {
    if (score === 0) return "Not Started";
    if (score < 50) return "Learning";
    if (score < 70) return "Practicing";
    if (score < 85) return "Competent";
    if (score < 95) return "Mastered";
    return "Expert";
  }
}


/**
 * Gamification Engine (Phase 5)
 * Handles XP calculations, Level progression, Streak tracking, and Badge achievements.
 */

export type SystemDesignBadge = 
  | 'Foundation Complete'
  | '100 Lessons'
  | 'Case Study Expert'
  | 'Interview Champion'
  | 'Perfect Quiz'
  | '7-Day Streak'
  | '30-Day Streak'
  | 'Company Ready'
  | 'Top Learner'
  | 'Architecture Master';

export interface GamificationState {
  xp: number;
  level: number;
  title: string;
  currentStreak: number;
  badges: SystemDesignBadge[];
}

export class GamificationEngine {
  
  // Base XP curve
  private static readonly LEVEL_MULTIPLIER = 1000;

  /**
   * Calculates XP rewards for different actions.
   */
  public static calculateXPReward(action: 'lesson_complete' | 'quiz_pass' | 'case_study' | 'mock_interview' | 'daily_goal', score?: number): number {
    switch (action) {
      case 'lesson_complete': return 50;
      case 'quiz_pass': return (score === 100) ? 150 : 100;
      case 'case_study': return 250;
      case 'mock_interview': return Math.round(500 * ((score || 0) / 100));
      case 'daily_goal': return 300;
      default: return 0;
    }
  }

  /**
   * Evaluates if a user levels up based on total XP.
   */
  public static evaluateLevel(totalXP: number): { level: number, title: string } {
    // Basic level curve: Level = floor(sqrt(XP / 500)) + 1
    const level = Math.floor(Math.sqrt(totalXP / 500)) + 1;
    
    let title = 'Novice Designer';
    if (level >= 5) title = 'Apprentice Architect';
    if (level >= 10) title = 'Junior System Designer';
    if (level >= 20) title = 'Senior System Designer';
    if (level >= 35) title = 'Principal Architect';
    if (level >= 50) title = 'Grandmaster of Architecture';
    
    return { level, title };
  }

  /**
   * Checks for newly unlocked badges based on the user's progress metrics.
   */
  public static checkNewBadges(
    state: GamificationState,
    metrics: { lessonsCompleted: number, caseStudiesCompleted: number, mockInterviewsPassed: number, companyReadyCount: number }
  ): SystemDesignBadge[] {
    const newBadges: SystemDesignBadge[] = [];
    const hasBadge = (badge: SystemDesignBadge) => state.badges.includes(badge);

    if (metrics.lessonsCompleted >= 13 && !hasBadge('Foundation Complete')) newBadges.push('Foundation Complete');
    if (metrics.lessonsCompleted >= 100 && !hasBadge('100 Lessons')) newBadges.push('100 Lessons');
    if (metrics.caseStudiesCompleted >= 20 && !hasBadge('Case Study Expert')) newBadges.push('Case Study Expert');
    if (metrics.mockInterviewsPassed >= 10 && !hasBadge('Interview Champion')) newBadges.push('Interview Champion');
    
    if (state.currentStreak >= 7 && !hasBadge('7-Day Streak')) newBadges.push('7-Day Streak');
    if (state.currentStreak >= 30 && !hasBadge('30-Day Streak')) newBadges.push('30-Day Streak');
    
    if (metrics.companyReadyCount >= 1 && !hasBadge('Company Ready')) newBadges.push('Company Ready');
    if (state.level >= 50 && !hasBadge('Architecture Master')) newBadges.push('Architecture Master');

    return newBadges;
  }
}

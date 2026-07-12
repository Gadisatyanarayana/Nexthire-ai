export class FeatureFlags {
  public static isAITutorEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_AI_TUTOR !== 'false';
  }

  public static isCertificatesEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_CERTIFICATES !== 'false';
  }

  public static isGamificationEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_GAMIFICATION !== 'false';
  }

  public static isReportsEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_REPORTS !== 'false';
  }

  public static isAnalyticsEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';
  }

  public static isLeaderboardEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_LEADERBOARD !== 'false';
  }

  public static isObservabilityEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY !== 'false';
  }

  public static isMonitoringEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'false';
  }
}

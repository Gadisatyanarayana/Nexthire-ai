export interface LeaderboardEntry {
  userId: string;
  contestId?: string;
  tenantId: string;
  score: number;
  rank: number;
  solvedCount: number;
  lastSolvedAt: Date;
}

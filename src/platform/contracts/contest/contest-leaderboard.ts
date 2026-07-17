export interface LeaderboardEntry {
  userId: string;
  contestId: string;
  score: number;
  penalty: number;
  rank: number;
  snapshotAt: Date;
}

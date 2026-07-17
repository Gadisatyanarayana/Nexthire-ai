export interface RatingPolicy {
  providerId: string; // 'ELO', 'GLICKO2'
  volatilityCap: number;
}

export interface RatingProvider {
  providerId: string;
  calculateRatings(leaderboard: any[], historicalRatings: any[]): any[];
}

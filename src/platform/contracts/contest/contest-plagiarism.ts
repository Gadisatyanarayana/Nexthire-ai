export interface PlagiarismProvider {
  providerId: string; // 'MOSS', 'JPLAG', 'AI'
  analyze(submissions: any[]): Promise<SimilarityReport>;
}

export interface SimilarityReport {
  id: string;
  contestId: string;
  matches: { userA: string, userB: string, similarityScore: number }[];
  generatedAt: Date;
}

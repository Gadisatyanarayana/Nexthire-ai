export interface DuplicateCandidate {
  questionId: string;
  title: string;
  similarityScore: number;
  reason: string;
}

export class DuplicateDetectorEngine {
  /**
   * Deterministically finds duplicate candidates.
   * This is meant to run globally across the DB or during batch ingestion.
   */
  async detectDuplicates(newTitle: string, newDescription: string, existingQuestions: any[]): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    
    // Normalize strings for comparison
    const normalizedNewTitle = newTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const eq of existingQuestions) {
      if (!eq.title) continue;
      
      const normalizedExistingTitle = eq.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (normalizedNewTitle === normalizedExistingTitle) {
        candidates.push({
          questionId: eq.id,
          title: eq.title,
          similarityScore: 1.0,
          reason: "Exact title match after normalization"
        });
      }
      
      // We can add Levenshtein distance, Jaccard similarity for descriptions, etc. here.
    }

    return candidates;
  }
}

export class DataQualityEngine {
  /**
   * Evaluates a validated row and assigns a quality score (0-100).
   * Low quality rows will be flagged and held in staging for editorial review.
   */
  static evaluate(row: Record<string, any>): number {
    let score = 100;

    // Empty explanation drops score significantly
    if (!row.explanation || row.explanation.trim().length === 0) {
      score -= 30;
    }

    // Missing hints
    if (!row.hints || row.hints.length === 0) {
      score -= 10;
    }

    // Checking for broken markdown/media
    if (row.title && row.title.includes('![') && !row.title.includes('http')) {
      score -= 40; // Broken image link
    }

    // Options validation (if MCQ)
    if (Array.isArray(row.options)) {
      const uniqueOptions = new Set(row.options);
      if (uniqueOptions.size !== row.options.length) {
        score -= 50; // Duplicate options
      }
    }

    return Math.max(0, score);
  }
}

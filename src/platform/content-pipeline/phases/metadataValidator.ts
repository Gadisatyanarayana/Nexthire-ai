export interface QuestionMetadata {
  title: string;
  category: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  companies: string[];
  tags: string[];
}

export class MetadataValidator {
  /**
   * Deterministically validates basic metadata.
   */
  static validate(metadata: Partial<QuestionMetadata>): { isValid: boolean; fixesApplied: string[] } {
    const fixesApplied: string[] = [];
    let isValid = true;

    // Validate Difficulty
    if (metadata.difficulty && !["Easy", "Medium", "Hard"].includes(metadata.difficulty)) {
      fixesApplied.push(`Invalid difficulty: ${metadata.difficulty}. Defaulted to Medium.`);
      metadata.difficulty = "Medium";
      isValid = false;
    }

    // Validate Category Exists in Master List (mock implementation for phase 2)
    const validCategories = ["Arrays & Strings", "Two Pointers", "Sliding Window", "Graph", "Dynamic Programming"];
    if (metadata.category && !validCategories.includes(metadata.category)) {
      fixesApplied.push(`Unrecognized category: ${metadata.category}. Tagged for manual review.`);
      isValid = false;
    }

    // Validate Title is not placeholder
    if (metadata.title && metadata.title.toLowerCase().includes("untitled")) {
      fixesApplied.push("Title contains placeholder. Needs generation.");
      isValid = false;
    }

    return { isValid, fixesApplied };
  }
}

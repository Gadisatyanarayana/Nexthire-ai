export interface QuestionData {
  metadata: any;
  samples: any[];
  hiddenTests: any[];
  editorial: string;
  hints: string[];
  starterCodes: Record<string, string>;
  optimalSolutions: Record<string, string>;
}

export class QualityGates {
  /**
   * Enforces that every single field is present and verified before publishing.
   */
  static isPublishable(question: QuestionData): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    if (!question.metadata || !question.metadata.title) {
      failures.push("Missing valid metadata.");
    }
    
    if (!question.samples || question.samples.length === 0) {
      failures.push("Missing sample test cases.");
    }
    
    if (!question.hiddenTests || question.hiddenTests.length < 5) {
      failures.push("Insufficient hidden test cases (minimum 5 required).");
    }

    if (!question.editorial || question.editorial.length < 100) {
      failures.push("Missing or incomplete editorial.");
    }

    if (!question.hints || question.hints.length === 0) {
      failures.push("Missing hints.");
    }

    if (!question.starterCodes || Object.keys(question.starterCodes).length === 0) {
      failures.push("Missing starter codes.");
    }

    if (!question.optimalSolutions || Object.keys(question.optimalSolutions).length === 0) {
      failures.push("Missing optimal solutions.");
    }

    return {
      passed: failures.length === 0,
      failures
    };
  }
}

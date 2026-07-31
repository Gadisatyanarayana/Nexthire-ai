import { ALL_OFFICIAL_LEETCODE_PROBLEMS, matchCanonicalLeetCodeProblem, isOfficialLeetCodeFunctionName } from "../data/OfficialLeetCodeCatalogIndex";
import { CanonicalLeetCodeProblem } from "../data/OfficialLeetCodeCatalog";
import { VerifiedSolutionBank, VerifiedSolution } from "../data/VerifiedSolutionBank";

export interface RestorationAuditResult {
  status: "RESTORED" | "REVIEW_REQUIRED" | "ALREADY_CANONICAL";
  id: string;
  originalTitle: string;
  restoredTitle?: string;
  restoredFunctionName?: string;
  confidence: number;
  reason?: string;
  canonicalData?: CanonicalLeetCodeProblem;
  verifiedSolution?: VerifiedSolution;
}

export class LeetCodeRestorationEngine {
  /**
   * Audits a raw database question and restores it to official LeetCode quality if matched,
   * or flags it for human review if it is an unmatched/corrupted problem.
   * For advanced Hard problems, prioritizes peer-reviewed accepted implementations from VerifiedSolutionBank.
   */
  public static auditAndRestore(rawQuestion: any): RestorationAuditResult {
    const title = rawQuestion.title || "";
    const id = rawQuestion.id || "";

    // Step 1: Strip artificial "Set X" prefixes/suffixes
    const cleanTitle = title.replace(/\s+Set\s+\d+$/i, "").trim();

    // Check VerifiedSolutionBank for peer-reviewed accepted implementations (e.g. 2117 Abbreviating the Product of a Range)
    const verifiedSol = VerifiedSolutionBank.getVerifiedSolution(id) || VerifiedSolutionBank.getVerifiedSolution(cleanTitle);

    // Step 2: Attempt matching against Canonical LeetCode Catalog
    const matched = matchCanonicalLeetCodeProblem(cleanTitle) || matchCanonicalLeetCodeProblem(id);

    if (matched) {
      // Check if raw question was already 100% canonical
      const isFnMatch = rawQuestion.starter_code?.javascript?.includes(`function ${matched.official_function_name}(`);
      const isTitleMatch = title === matched.title;
      const isTestCasesMatch = Array.isArray(rawQuestion.testcases) && rawQuestion.testcases.length === 23;

      if (isFnMatch && isTitleMatch && isTestCasesMatch) {
        return {
          status: "ALREADY_CANONICAL",
          id: rawQuestion.id,
          originalTitle: title,
          restoredTitle: matched.title,
          restoredFunctionName: matched.official_function_name,
          confidence: 100,
          canonicalData: matched,
          verifiedSolution: verifiedSol
        };
      }

      // Otherwise, restore 100% official LeetCode metadata, starter codes, and test cases
      return {
        status: "RESTORED",
        id: rawQuestion.id,
        originalTitle: title,
        restoredTitle: matched.title,
        restoredFunctionName: matched.official_function_name,
        confidence: 100,
        canonicalData: matched,
        verifiedSolution: verifiedSol
      };
    }

    // Step 3: If unmatched, do NOT guess -> send to Review Queue
    return {
      status: "REVIEW_REQUIRED",
      id: rawQuestion.id,
      originalTitle: title,
      confidence: 0,
      reason: "UNMATCHED_CORRUPTED_PROBLEM: Does not match any known canonical LeetCode signature."
    };
  }

  /**
   * Converts a CanonicalLeetCodeProblem into the Supabase database row format for `questions` table.
   * Ensures compatibility with exact Supabase `questions` column schema.
   */
  public static toDatabaseRow(problem: CanonicalLeetCodeProblem): any {
    return {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: [problem.master_category, problem.sub_pattern, ...problem.topic],
      company_tags: problem.company_tags,
      pattern_tags: problem.pattern_tags,
      acceptance_rate: problem.acceptance_rate,
      description: problem.description,
      examples: problem.examples,
      starter_code: problem.starter_code,
      testcases: problem.testcases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        category: tc.category || "normal"
      }))
    };
  }
}

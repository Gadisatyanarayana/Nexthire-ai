import { createClient } from "@supabase/supabase-js";
import { ALL_OFFICIAL_LEETCODE_PROBLEMS, matchCanonicalLeetCodeProblem } from "@/platform/content-pipeline/data/OfficialLeetCodeCatalogIndex";

export class ProblemService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch full problem payload including coding details with fallback to canonical catalog
   */
  async getProblemDetails(tenantId: string, problemId: string) {
    try {
      const { data } = await this.supabase
        .from("platform_questions")
        .select(`
          *,
          coding_problem_details (
            starter_code,
            supported_languages,
            constraints,
            time_limit_ms,
            memory_limit_mb
          )
        `)
        .eq("id", problemId)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          title: data.title || data.question_text || "Coding Problem",
          difficulty: data.difficulty || data.difficulty_level || "Medium",
          description: data.description_markdown || data.question_text || "",
          type: data.type || "Coding",
          codingDetails: Array.isArray(data.coding_problem_details) ? data.coding_problem_details[0] : data.coding_problem_details
        };
      }

      // Fallback to primary questions table
      const { data: qData } = await this.supabase
        .from("questions")
        .select("*")
        .eq("id", problemId)
        .maybeSingle();

      if (qData) {
        return {
          id: qData.id,
          title: qData.title || "Coding Problem",
          difficulty: qData.difficulty || "Medium",
          description: qData.description || "",
          type: "Coding",
          codingDetails: {
            starter_code: qData.starter_code || {},
            supported_languages: ["javascript", "python", "java", "cpp"],
            constraints: qData.constraints || [],
            time_limit_ms: 2000,
            memory_limit_mb: 256
          },
          examples: qData.examples || [],
          testcases: qData.testcases || [],
          topic: qData.topic || [],
          company_tags: qData.company_tags || [],
          pattern_tags: qData.pattern_tags || [],
          acceptance_rate: qData.acceptance_rate || 50
        };
      }
    } catch (e) {
      console.warn("Database lookup error in ProblemService, falling back to canonical catalog:", e);
    }

    // Fallback to Canonical LeetCode Catalog
    const matched = matchCanonicalLeetCodeProblem(problemId);
    const numIdx = parseInt(problemId, 10);
    const canonical = matched || (Number.isInteger(numIdx) && numIdx > 0 && numIdx <= ALL_OFFICIAL_LEETCODE_PROBLEMS.length
      ? ALL_OFFICIAL_LEETCODE_PROBLEMS[numIdx - 1]
      : ALL_OFFICIAL_LEETCODE_PROBLEMS[0]);

    return {
      id: canonical.id,
      title: canonical.title,
      difficulty: canonical.difficulty,
      description: canonical.description,
      type: "Coding",
      codingDetails: {
        starter_code: canonical.starter_code,
        supported_languages: ["java", "python", "cpp", "javascript", "typescript"],
        constraints: ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        time_limit_ms: 2000,
        memory_limit_mb: 256
      },
      examples: canonical.examples || [],
      testcases: (canonical.testcases || []).map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden
      })),
      topic: canonical.topic || [],
      company_tags: canonical.company_tags || [],
      pattern_tags: canonical.pattern_tags || [],
      acceptance_rate: canonical.acceptance_rate || 50,
      official_function_name: canonical.official_function_name
    };
  }
}

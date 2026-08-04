import { createClient } from "@supabase/supabase-js";
import { ALL_OFFICIAL_LEETCODE_PROBLEMS, matchCanonicalLeetCodeProblem } from "@/platform/content-pipeline/data/OfficialLeetCodeCatalogIndex";

export class ProblemService {
  private supabase;
  private static cache = new Map<string, any>();

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch full problem payload including coding details with zero-latency canonical catalog lookup and memory caching
   */
  async getProblemDetails(tenantId: string, problemId: string) {
    const cacheKey = `${tenantId}:${problemId}`;
    if (ProblemService.cache.has(cacheKey)) {
      return ProblemService.cache.get(cacheKey);
    }

    // 1. Zero-latency lookup in canonical LeetCode Catalog FIRST
    const matched = matchCanonicalLeetCodeProblem(problemId);
    if (matched) {
      const canonicalResult = {
        id: matched.id,
        title: matched.title,
        difficulty: matched.difficulty,
        description: matched.description,
        type: "Coding",
        codingDetails: {
          starter_code: matched.starter_code,
          supported_languages: ["java", "python", "cpp", "javascript", "typescript"],
          constraints: ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
          time_limit_ms: 2000,
          memory_limit_mb: 256
        },
        examples: matched.examples || [],
        testcases: (matched.testcases || []).map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        })),
        topic: matched.topic || [],
        company_tags: matched.company_tags || [],
        pattern_tags: matched.pattern_tags || [],
        acceptance_rate: matched.acceptance_rate || 50,
        official_function_name: matched.official_function_name
      };
      ProblemService.cache.set(cacheKey, canonicalResult);
      return canonicalResult;
    }

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
        const result = {
          id: data.id,
          title: data.title || data.question_text || "Coding Problem",
          difficulty: data.difficulty || data.difficulty_level || "Medium",
          description: data.description_markdown || data.question_text || "",
          type: data.type || "Coding",
          codingDetails: Array.isArray(data.coding_problem_details) ? data.coding_problem_details[0] : data.coding_problem_details
        };
        ProblemService.cache.set(cacheKey, result);
        return result;
      }

      // Fallback to primary questions table
      const { data: qData } = await this.supabase
        .from("questions")
        .select("*")
        .eq("id", problemId)
        .maybeSingle();

      if (qData) {
        const result = {
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
        ProblemService.cache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("Database lookup error in ProblemService, falling back to canonical catalog:", e);
    }

    // Fallback to Canonical LeetCode Catalog
    const numIdx = parseInt(problemId, 10);
    const canonical = (Number.isInteger(numIdx) && numIdx > 0 && numIdx <= ALL_OFFICIAL_LEETCODE_PROBLEMS.length
      ? ALL_OFFICIAL_LEETCODE_PROBLEMS[numIdx - 1]
      : ALL_OFFICIAL_LEETCODE_PROBLEMS[0]);

    const fallbackResult = {
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
    ProblemService.cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

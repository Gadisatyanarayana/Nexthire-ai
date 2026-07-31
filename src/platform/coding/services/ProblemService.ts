import { createClient } from "@supabase/supabase-js";

export class ProblemService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch full problem payload including coding details with fallback to questions table
   */
  async getProblemDetails(tenantId: string, problemId: string) {
    const { data, error } = await this.supabase
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
          constraints: [],
          time_limit_ms: 2000,
          memory_limit_mb: 256
        }
      };
    }

    throw new Error("Problem not found");
  }
}

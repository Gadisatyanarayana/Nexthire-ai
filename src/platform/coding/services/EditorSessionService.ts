import { createClient } from "@supabase/supabase-js";

export class EditorSessionService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getSession(tenantId: string, userId: string, questionId: string) {
    const { data, error } = await this.supabase
      .from("coding_editor_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching session:", error);
      throw new Error("Failed to fetch editor session");
    }

    return data;
  }

  async saveSession(
    tenantId: string,
    userId: string,
    questionId: string,
    currentLanguage: string,
    codeContent: string,
    cursorPosition: any
  ) {
    const session = {
      tenant_id: tenantId,
      user_id: userId,
      question_id: questionId,
      current_language: currentLanguage,
      code_content: codeContent,
      cursor_position: cursorPosition,
    };

    const { error } = await this.supabase
      .from("coding_editor_sessions")
      .upsert(session, { onConflict: 'user_id, question_id' });

    if (error) {
      console.error("Error saving session:", error);
      throw new Error("Failed to save editor session");
    }
  }
}

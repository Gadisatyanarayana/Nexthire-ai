import { createClient } from "@supabase/supabase-js";

export class EditorSessionService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-supabase.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getSession(tenantId: string, userId: string, questionId: string) {
    try {
      const { data, error } = await this.supabase
        .from("coding_editor_sessions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .maybeSingle();

      if (error) {
        if (error.code !== "PGRST116") {
          console.warn("Non-fatal session query warning:", error.message || error);
        }
        return null;
      }

      return data;
    } catch (err) {
      console.warn("Failed to fetch editor session safely:", err);
      return null;
    }
  }

  async saveSession(
    tenantId: string,
    userId: string,
    questionId: string,
    currentLanguage: string,
    codeContent: string,
    cursorPosition: any
  ) {
    try {
      const session = {
        tenant_id: tenantId,
        user_id: userId,
        question_id: questionId,
        current_language: currentLanguage,
        code_content: codeContent,
        cursor_position: cursorPosition,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("coding_editor_sessions")
        .upsert(session, { onConflict: "tenant_id,user_id,question_id" })
        .select("*")
        .single();

      if (error) {
        console.warn("Non-fatal session save warning:", error.message || error);
        return null;
      }

      return data;
    } catch (err) {
      console.warn("Failed to save editor session safely:", err);
      return null;
    }
  }
}

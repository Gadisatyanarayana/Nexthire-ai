import { getAdminClient } from "@/lib/supabaseAdmin";
import { LLMMessage } from "@/lib/llm/SafeLLMClient";

export class ConversationEngine {
  private static MAX_HISTORY_TOKENS = 4000;

  /**
   * Resumes or initializes a conversation session
   */
  public static async getSessionHistory(sessionId: string): Promise<LLMMessage[]> {
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from('apt_ai_sessions')
      .select('context_data')
      .eq('id', sessionId)
      .single();

    if (error || !data) return [];
    
    return data.context_data?.history || [];
  }

  /**
   * Saves conversation history and handles context window compression
   */
  public static async saveSessionHistory(sessionId: string, userId: string, history: LLMMessage[], newMessages: LLMMessage[], context: any = {}) {
    let fullHistory = [...history, ...newMessages];
    
    // Naive token budget management (compression by dropping oldest messages)
    // A robust implementation would use a tokenizer library (e.g. tiktoken)
    if (fullHistory.length > 20) {
      // Summarize or truncate
      fullHistory = [
        { role: 'system', content: 'Conversation was truncated to save context window.' },
        ...fullHistory.slice(-10)
      ];
    }

    const contextData = {
      history: fullHistory,
      lesson_context: context.lesson || null,
      formula_context: context.formula || null,
      quiz_context: context.quiz || null,
      mock_context: context.mock || null,
      company_context: context.company || null,
      last_updated: new Date().toISOString()
    };

    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin
      .from('apt_ai_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        session_type: context.type || 'tutor',
        context_data: contextData,
        started_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error("Failed to save conversation history", error);
    }
  }
}

import { supabase } from "@/lib/supabase";
import { ResumeDocument, InterviewContext } from "@/components/resume-builder/types";

/**
 * Enterprise Database Layer for Resume OS
 * Handles data mapping between the UI JSON schema and normalized DB tables.
 */
export class ResumeRepository {
  
  static async saveResume(email: string, resumeId: string, form: ResumeDocument) {
    // Legacy support: We still commit to user_progress.resume_data for backward compatibility
    // but in a real SaaS migration, we would use the normalized tables discussed in Phase 4.
    const { data: userData } = await supabase
      .from("user_progress")
      .select("resume_data")
      .eq("email", email)
      .single();

    const currentData = userData?.resume_data || {};
    const resumes = currentData.resumes || {};
    resumes[resumeId] = form;

    const { error } = await supabase
      .from("user_progress")
      .update({ resume_data: { ...currentData, resumes } })
      .eq("email", email);

    if (error) throw error;
    return true;
  }

  static async saveInterviewContext(userId: string, context: InterviewContext, resumeId: string, targetCompany: string) {
    // Maps to the normalized interview_contexts table
    // Fallback to user_progress if table doesn't exist yet in the DB
    try {
      const { error } = await supabase
        .from("interview_contexts")
        .insert({
          user_id: userId,
          resume_id: resumeId,
          target_company: targetCompany,
          target_role: context.targetRole,
          generated_context: context,
          difficulty: context.difficulty
        });
      
      if (error) {
        console.warn("Normalized table 'interview_contexts' missing. Falling back to user_progress.");
        throw error;
      }
    } catch (e) {
      // Fallback
      await this.saveInterviewContextFallback(userId, context);
    }
  }

  private static async saveInterviewContextFallback(email: string, context: InterviewContext) {
    const { data: userData } = await supabase
      .from("user_progress")
      .select("resume_data")
      .eq("email", email)
      .single();

    const currentData = userData?.resume_data || {};
    const newContext = { ...currentData, interview_context: context };
    
    await supabase
      .from("user_progress")
      .update({ resume_data: newContext })
      .eq("email", email);
  }
}

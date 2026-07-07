import { z } from "zod";

/**
 * Validates that any parsed lesson strictly adheres to the mandatory 
 * fields of the 23-step lesson template before being inserted into the database.
 */
export const lessonSchema = z.object({
  // Metadata
  title: z.string().min(5, "Title must be at least 5 characters"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  reading_time: z.string().min(4, "Must provide reading time, e.g., '10 min'"),
  prerequisites: z.array(z.string()).min(1, "At least one prerequisite is required"),
  learning_outcomes: z.array(z.string()).min(2, "At least two learning outcomes are required"),
  
  // Core Theory
  beginner_explanation: z.string().min(50, "Beginner explanation must be at least 50 characters"),
  intermediate_explanation: z.string().min(50, "Intermediate explanation must be at least 50 characters"),
  interview_explanation: z.string().min(50, "Interview explanation must be at least 50 characters"),
  
  // Visuals & Diagrams
  architecture_diagram_url: z.string().url("Must provide a valid architecture diagram URL or asset path").optional(),
  flow_diagram_url: z.string().url("Must provide a valid flow diagram URL or asset path").optional(),
  
  // Real World & Depth
  real_world_example: z.string().min(50, "Real-world example must be detailed"),
  trade_offs: z.string().min(20, "Trade-offs must be documented"),
  common_mistakes: z.array(z.string()).min(1, "At least one common mistake is required"),
  
  // Revision & Practice
  cheat_sheet: z.string().min(20, "Cheat sheet summary required"),
  revision_notes: z.string().min(20, "Revision notes required"),
  
  // Interactivity
  practice_questions: z.array(z.object({
    q: z.string(),
    opts: z.array(z.string()).length(4),
    correct: z.number().min(0).max(3),
    exp: z.string()
  })).min(3, "At least 3 practice questions required"),
  
  previous_interview_questions: z.array(z.string()).min(1, "At least one previous interview question required"),
  
  ai_mentor_prompts: z.array(z.string()).min(2, "At least two AI mentor prompts required"),
  related_lessons: z.array(z.string()).min(1, "Must link to at least one related lesson"),
});

export type ValidatedLesson = z.infer<typeof lessonSchema>;

/**
 * Helper function to validate a lesson payload. Throws ZodError if invalid.
 */
export function validateLesson(payload: unknown): ValidatedLesson {
  return lessonSchema.parse(payload);
}

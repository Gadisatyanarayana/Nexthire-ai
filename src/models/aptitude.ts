import { z } from "zod";

export const AptitudeModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  level_order: z.number(),
  created_at: z.string().optional(),
  // Knowledge Graph Extensions
  parent_id: z.string().optional(),
  child_ids: z.array(z.string()).optional(),
  required_dependencies: z.array(z.string()).optional(),
  recommended_dependencies: z.array(z.string()).optional(),
});
export type AptitudeModule = z.infer<typeof AptitudeModuleSchema>;

export const AptitudeLessonSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  title: z.string(),
  difficulty: z.string(),
  reading_time: z.string(),
  content: z.any(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  created_at: z.string().optional(),
  // Knowledge Graph Extensions
  parent_id: z.string().optional(),
  child_ids: z.array(z.string()).optional(),
  required_dependencies: z.array(z.string()).optional(),
  recommended_dependencies: z.array(z.string()).optional(),
  concepts_learned: z.array(z.string()).optional(),
  concepts_required_next: z.array(z.string()).optional(),
  module_milestone: z.boolean().optional(),
});
export type AptitudeLesson = z.infer<typeof AptitudeLessonSchema>;

export const AptitudeFormulaSchema = z.object({
  id: z.string().optional(),
  topic_id: z.string(),
  formula_text: z.string(),
  example_q: z.string().optional(),
  example_a: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});
export type AptitudeFormula = z.infer<typeof AptitudeFormulaSchema>;

export const AptitudeQuestionSchema = z.object({
  id: z.string().optional(),
  lesson_id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number(),
  explanation: z.string(),
  difficulty: z.string(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  companies: z.array(z.string()).optional(),
  apt_company_tags: z.any().optional(),
});
export type AptitudeQuestion = z.infer<typeof AptitudeQuestionSchema>;

export const AptitudeMockSessionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  start_time: z.string(),
  end_time: z.string().optional(),
  score: z.number(),
  session_data: z.any(),
});
export type AptitudeMockSession = z.infer<typeof AptitudeMockSessionSchema>;

export const AptitudeTopicMasterySchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  topic_id: z.string(),
  mastery_score: z.number(),
  mastery_level: z.enum(["Not Started", "Learning", "Practicing", "Competent", "Mastered", "Expert"]).default("Not Started"),
  questions_attempted: z.number(),
  last_reviewed_at: z.string().optional(),
  revision_queue_date: z.string().optional(),
  confidence_score: z.number().optional(),
});
export type AptitudeTopicMastery = z.infer<typeof AptitudeTopicMasterySchema>;

// Seed data types
export type AptitudeSeedData = {
  modules: AptitudeModule[];
  lessons: AptitudeLesson[];
  formulas: AptitudeFormula[];
  questions: AptitudeQuestion[];
};

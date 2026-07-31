import { z } from "zod";

export const VerbalModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  level_order: z.number(),
  created_at: z.string().optional(),
  parent_id: z.string().optional(),
  child_ids: z.array(z.string()).optional(),
  required_dependencies: z.array(z.string()).optional(),
  recommended_dependencies: z.array(z.string()).optional(),
});
export type VerbalModule = z.infer<typeof VerbalModuleSchema>;

export const VerbalLessonSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  title: z.string(),
  difficulty: z.string(),
  reading_time: z.string(),
  content: z.any(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  created_at: z.string().optional(),
  parent_id: z.string().optional(),
  child_ids: z.array(z.string()).optional(),
  required_dependencies: z.array(z.string()).optional(),
  recommended_dependencies: z.array(z.string()).optional(),
  concepts_learned: z.array(z.string()).optional(),
  concepts_required_next: z.array(z.string()).optional(),
  module_milestone: z.boolean().optional(),
});
export type VerbalLesson = z.infer<typeof VerbalLessonSchema>;

export const VerbalFormulaSchema = z.object({
  id: z.string().optional(),
  topic_id: z.string(),
  formula_text: z.string(),
  example_q: z.string().optional(),
  example_a: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});
export type VerbalFormula = z.infer<typeof VerbalFormulaSchema>;

export const VerbalQuestionSchema = z.object({
  id: z.string().optional(),
  lesson_id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number(),
  explanation: z.string(),
  difficulty: z.string(),
  companies: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});
export type VerbalQuestion = z.infer<typeof VerbalQuestionSchema>;

export const VerbalCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  logo_url: z.string().optional(),
  slug: z.string(),
});
export type VerbalCompany = z.infer<typeof VerbalCompanySchema>;

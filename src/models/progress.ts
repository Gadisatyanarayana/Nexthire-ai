import { z } from "zod";

export const ContentTypeEnum = z.enum([
  "LESSON",
  "PRACTICE",
  "ASSESSMENT",
  "CODING",
  "SQL",
  "MONGODB",
  "INTERVIEW",
  "SYSTEM_DESIGN",
  "VIDEO",
  "DOCUMENT",
]);

export const LearningStatusEnum = z.enum([
  "LOCKED",
  "AVAILABLE",
  "STARTED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "MASTERED",
  "REVIEW_REQUIRED",
]);

export const XPSourceEnum = z.enum([
  "LESSON_COMPLETE",
  "MODULE_COMPLETE",
  "DAILY_STREAK",
  "PRACTICE",
  "ASSESSMENT",
  "CODING",
  "INTERVIEW",
  "ADMIN_REWARD",
]);

export const LearningEventType = z.enum([
  "lesson_opened",
  "lesson_closed",
  "lesson_completed",
  "lesson_reopened",
  "resume_clicked",
  "bookmark_added",
  "note_created",
  "note_updated",
  "discussion_opened",
  "ai_hint_requested",
  "ai_explanation_requested",
  "practice_started",
  "practice_completed",
  "assessment_started",
  "assessment_submitted",
  "assessment_passed",
  "assessment_failed",
  "code_executed",
  "coding_submission",
  "coding_accepted",
  "coding_failed",
  "sql_executed",
  "interview_completed",
  "solution_viewed",
]);

export const ResumeStateSchema = z.object({
  sectionId: z.string().optional(),
  subSectionId: z.string().optional(),
  scroll: z.number().optional(),
  tab: z.string().optional(),
  videoTime: z.number().optional(),
  activeElement: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

export const LearningProgressSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content_type: ContentTypeEnum,
  content_id: z.string(),
  content_version: z.number().default(1),
  status: LearningStatusEnum.default("AVAILABLE"),
  resume_state: ResumeStateSchema.default({}),
  active_time_seconds: z.number().default(0),
  idle_time_seconds: z.number().default(0),
  background_time_seconds: z.number().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  is_deleted: z.boolean().default(false),
});

export const UserStatsSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  total_xp: z.number().default(0),
  current_streak: z.number().default(0),
  longest_streak: z.number().default(0),
  current_level: z.number().default(1),
  last_activity_at: z.string().optional(),
  ai_metadata: z.record(z.string(), z.any()).default({}),
  updated_at: z.string().optional(),
});

export const XPTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number(),
  source_type: XPSourceEnum,
  source_id: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string().optional(),
});

export const DailyActivitySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  activity_date: z.string(),
  active_seconds: z.number().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const LearningSessionSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content_type: ContentTypeEnum,
  content_id: z.string(),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
  duration_seconds: z.number().default(0),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  ip_hash: z.string().optional(),
});

export type LearningProgress = z.infer<typeof LearningProgressSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type XPTransaction = z.infer<typeof XPTransactionSchema>;
export type DailyActivity = z.infer<typeof DailyActivitySchema>;
export type ResumeState = z.infer<typeof ResumeStateSchema>;
export type LearningSession = z.infer<typeof LearningSessionSchema>;

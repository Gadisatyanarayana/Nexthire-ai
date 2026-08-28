import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  jsonb, 
  boolean,
  integer,
  varchar,
  pgEnum
} from 'drizzle-orm/pg-core';

// --- ENUMS ---
export const resumeStatusEnum = pgEnum('resume_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'FAVORITE', 'TEMPLATE']);
export const aiJobStatusEnum = pgEnum('ai_job_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING']);
export const aiJobTypeEnum = pgEnum('ai_job_type', ['PARSE', 'ATS_REVIEW', 'JD_MATCH', 'COVER_LETTER', 'CAREER_COACH', 'BULLET_REWRITE']);

// --- TABLES ---

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  status: resumeStatusEnum('status').default('DRAFT').notNull(),
  targetRole: text('target_role'),
  themeSettings: jsonb('theme_settings'),
  typographySettings: jsonb('typography_settings'),
  layout: jsonb('layout'),
  sections: jsonb('sections').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeVersions = pgTable('resume_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  snapshot: jsonb('snapshot').notNull(), // Full copy of sections/layout
  changeReason: text('change_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const resumeRawDocuments = pgTable('resume_raw_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  rawText: text('raw_text').notNull(),
  pageCount: integer('page_count').default(1),
  parser: text('parser').notNull(), // e.g. 'pdf-parse', 'mammoth'
  fileHash: text('file_hash').notNull(), // SHA-256 for caching
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const resumeDocuments = pgTable('resume_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  content: jsonb('content').notNull(), // The structured resume data (skills, projects, etc)
  metadata: jsonb('metadata').notNull(), // schemaVersion, promptVersion, etc
  confidenceScores: jsonb('confidence_scores'), // confidence 0-100 per section
  unknownSections: jsonb('unknown_sections'), // array of unmapped data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeIntelligence = pgTable('resume_intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  careerInsights: jsonb('career_insights').notNull(),
  aiRecommendations: jsonb('ai_recommendations'),
  analytics: jsonb('analytics'),
  metadata: jsonb('metadata').notNull(), // version, schemaVersion, provider, model, generatedAt, resumeHash, promptVersion, cacheVersion
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeATSResults = pgTable('resume_ats_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  overallScore: integer('overall_score').notNull(),
  dimensions: jsonb('dimensions').notNull(),
  review: jsonb('review').notNull(),
  resumeHash: text('resume_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const resumeJDMatches = pgTable('resume_jd_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  jobDescriptionId: text('job_description_id').notNull(), // Optional: reference to JD table if it exists
  jobDescriptionText: text('job_description_text'),
  overallMatch: integer('overall_match').notNull(),
  roleFit: integer('role_fit').notNull(),
  technicalFit: integer('technical_fit').notNull(),
  softSkillsMatch: integer('soft_skills_match').notNull(),
  missingKeywords: jsonb('missing_keywords').notNull(),
  recommendedKeywords: jsonb('recommended_keywords').notNull(),
  matchingProjects: jsonb('matching_projects').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const resumeAIJobs = pgTable('resume_ai_jobs', {
  id: uuid('id').primaryKey().defaultRandom(), // Also acts as jobId
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  jobType: aiJobTypeEnum('job_type').notNull(),
  priority: integer('priority').default(0).notNull(),
  status: aiJobStatusEnum('status').default('PENDING').notNull(),
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: text('error'),
  attempts: integer('attempts').default(0).notNull(),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  workerId: text('worker_id'),
  provider: text('provider'),
  model: text('model'),
  estimatedTokens: integer('estimated_tokens'),
  actualTokens: integer('actual_tokens'),
  costEstimate: integer('cost_estimate'), // Stored in cents or micro-cents depending on scaling
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const interviewContexts = pgTable('interview_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  targetCompany: text('target_company'),
  targetRole: text('target_role'),
  difficulty: text('difficulty'),
  resumeProfile: jsonb('resume_profile'),
  atsAnalysis: jsonb('ats_analysis'),
  jdAnalysis: jsonb('jd_analysis'),
  conversationMemory: jsonb('conversation_memory'),
  interviewGoals: jsonb('interview_goals'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeTemplates = pgTable('resume_templates', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  defaultThemeSettings: jsonb('default_theme_settings').notNull(),
  defaultTypographySettings: jsonb('default_typography_settings').notNull(),
  defaultLayout: jsonb('default_layout').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const resumeExports = pgTable('resume_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  format: text('format').notNull(), // 'PDF', 'DOCX', 'TXT'
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

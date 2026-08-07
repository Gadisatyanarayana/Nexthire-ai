import { z } from 'zod';

export const ResumeDocumentSchema = z.object({
  personal: z.object({
    fullName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    bullets: z.array(z.string())
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    gpa: z.string().optional()
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    link: z.string().url().optional(),
    technologies: z.array(z.string()).optional(),
    bullets: z.array(z.string())
  })),
  skills: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string().optional()
  })).optional(),
  confidenceScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
  unknownSections: z.array(z.any()).optional()
});

export const ResumeIntelligenceSchema = z.object({
  careerLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'] as [string, ...string[]]),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  atsScoreEstimate: z.number().min(0).max(100).optional(),
  targetRoles: z.array(z.string()),
  metadata: z.object({
    parserVersion: z.string(),
    promptVersion: z.string(),
    schemaVersion: z.string(),
    pipelineVersion: z.string().optional(),
    provider: z.string(),
    model: z.string(),
    cacheVersion: z.string().optional(),
  })
});

export const ATSAnalysisSchema = z.object({
  overallScore: z.number(),
  confidence: z.number(),
  percentile: z.number(),
  target: z.string(),
  dimensionScores: z.object({
    content: z.object({ score: z.number(), earned: z.number(), possible: z.number(), reasons: z.array(z.string()) }),
    formatting: z.object({ score: z.number(), earned: z.number(), possible: z.number(), reasons: z.array(z.string()) }),
    readability: z.object({ score: z.number(), earned: z.number(), possible: z.number(), reasons: z.array(z.string()) }),
    keywords: z.object({ score: z.number(), earned: z.number(), possible: z.number(), reasons: z.array(z.string()) }),
    impact: z.object({ score: z.number(), earned: z.number(), possible: z.number(), reasons: z.array(z.string()) }),
    atsCompatibility: z.object({ score: z.number(), earned: z.number(), possible: z.number(), reasons: z.array(z.string()) }),
  }),
  qualityMetrics: z.object({
    resumeCompleteness: z.number(),
    resumeConsistency: z.number(),
    resumeProfessionalism: z.number(),
    resumeTechnicalStrength: z.number()
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.object({
    id: z.string().optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW'] as [string, ...string[]]),
    effort: z.enum(['HIGH', 'MEDIUM', 'LOW'] as [string, ...string[]]),
    impact: z.enum(['HIGH', 'MEDIUM', 'LOW'] as [string, ...string[]]),
    text: z.string()
  })),
  missingKeywords: z.array(z.string()),
  duplicateBullets: z.array(z.string()),
  statistics: z.object({
    bulletCount: z.number(),
    quantifiedBullets: z.number(),
    actionVerbCoverage: z.number(),
    keywordDensity: z.number()
  }),
  version: z.object({
    reportVersion: z.number(),
    resumeVersion: z.number(),
    engineVersion: z.string(),
    promptVersion: z.string(),
    generatedAt: z.string()
  })
});

import { z } from 'zod';

export const JDMatchResultSchema = z.object({
  overallMatch: z.number().min(0).max(100).describe('Overall match percentage out of 100'),
  roleFit: z.number().min(0).max(100).describe('How well the past roles align with the JD requirements'),
  technicalFit: z.number().min(0).max(100).describe('How well the technical stack aligns'),
  softSkillsMatch: z.number().min(0).max(100).describe('How well soft skills/leadership align'),
  missingKeywords: z.array(z.string()).describe('List of exact critical keywords present in the JD but missing from the resume'),
  recommendedKeywords: z.array(z.string()).describe('Keywords the candidate should add to improve ATS score'),
  matchingProjects: z.array(z.string()).describe('Specific projects or experiences from the resume that best map to this JD')
});

export type JDMatchResult = z.infer<typeof JDMatchResultSchema>;

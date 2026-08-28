import { ResumeDocument, ResumeIntelligence, ATSAnalysis } from '../../../../components/resume-builder/types';

export interface Issue {
  id?: string;
  category: 'CONTENT' | 'FORMATTING' | 'READABILITY' | 'KEYWORDS' | 'IMPACT' | 'ATS_COMPATIBILITY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string; // The issue key mapped in recommendations.json
  context?: string; // Optional context, e.g. "Missing LinkedIn"
}

export interface ATSMetadata {
  engineVersion: string;
  promptVersion: string;
  startTime: number;
}

export interface ATSContext {
  resumeDocument: ResumeDocument;
  resumeIntelligence: ResumeIntelligence;
  issues: Issue[];
  metrics: {
    bulletCount: number;
    quantifiedBullets: number;
    actionVerbCoverage: number;
    keywordDensity: number;
    resumeCompleteness: number;
    resumeConsistency: number;
    resumeProfessionalism: number;
    resumeTechnicalStrength: number;
    missingKeywords: string[];
    duplicateBullets: string[];
    [key: string]: any;
  };
  scores: {
    content: { score: number; earned: number; possible: number; reasons: string[] };
    formatting: { score: number; earned: number; possible: number; reasons: string[] };
    readability: { score: number; earned: number; possible: number; reasons: string[] };
    keywords: { score: number; earned: number; possible: number; reasons: string[] };
    impact: { score: number; earned: number; possible: number; reasons: string[] };
    atsCompatibility: { score: number; earned: number; possible: number; reasons: string[] };
    [key: string]: any;
  };
  metadata: ATSMetadata;
  finalAnalysis?: Partial<ATSAnalysis>;
}

export interface ATSEngineStage {
  name: string;
  execute(context: ATSContext): Promise<void>;
}

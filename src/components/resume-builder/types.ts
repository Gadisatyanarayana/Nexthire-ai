export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  employmentType: string;
  isRemote: boolean;
  startDate: string;
  endDate: string;
  current: boolean;
  techStack?: string;
  achievements: string[];
}

export interface Project {
  id: string;
  name: string;
  category: string;
  techStack: string;
  github: string;
  liveUrl: string;
  duration: string;
  role: string;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institute: string;
  degree: string;
  branch?: string;
  cgpa: string;
  startDate: string;
  endDate: string;
  coursework: string[];
  activities: string;
  achievements: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string;
}

export interface ThemeSettings {
  id: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headerStyle: string;
  sectionDivider: string;
  bulletStyle: string;
  borderRadius: string;
  iconPack: string;
  shadow: string;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  headingSize: string;
  bodySize: string;
  lineHeight: number;
  letterSpacing: string;
  paragraphGap: string;
  sectionGap: string;
  pageMargins: string;
  columns: number;
}

export interface ResumeSection {
  id: string;
  type: string; // 'personal', 'summary', 'experience', 'education', 'projects', 'skills', etc.
  visible: boolean;
  data: any; // Dynamic payload based on the Section Registry
}

// --- AI INTELLIGENCE SCHEMA ---

export interface CareerInsights {
  careerLevel: string;
  targetRoles: string[];
  primaryStack: string[];
  strengths: string[];
  weaknesses: string[];
  leadership: string[];
  achievements: string[];
  missingSections: string[];
  estimatedExperience: string;
  careerSummary: string;
}

export interface ATSAnalysis {
  overallScore: number;
  confidence: number;
  percentile: number;
  target: string;
  dimensionScores: {
    content: { score: number; earned: number; possible: number; reasons: string[] };
    formatting: { score: number; earned: number; possible: number; reasons: string[] };
    readability: { score: number; earned: number; possible: number; reasons: string[] };
    keywords: { score: number; earned: number; possible: number; reasons: string[] };
    impact: { score: number; earned: number; possible: number; reasons: string[] };
    atsCompatibility: { score: number; earned: number; possible: number; reasons: string[] };
  };
  qualityMetrics: {
    resumeCompleteness: number;
    resumeConsistency: number;
    resumeProfessionalism: number;
    resumeTechnicalStrength: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    id?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    effort: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    text: string;
  }[];
  missingKeywords: string[];
  duplicateBullets: string[];
  statistics: {
    bulletCount: number;
    quantifiedBullets: number;
    actionVerbCoverage: number;
    keywordDensity: number;
  };
  version: {
    reportVersion: number;
    resumeVersion: number;
    engineVersion: string;
    promptVersion: string;
    generatedAt: string;
  };
}

export interface JDAnalysis {
  overallMatch: number;
  roleFit: number;
  technicalFit: number;
  softSkillsMatch: number;
  missingKeywords: string[];
  recommendedKeywords: string[];
  matchingProjects: string[];
}

export interface AIRecommendations {
  bulletImprovements: string[];
  coverLetterReady: boolean;
  targetCompanies: string[];
}

export interface InterviewContext {
  targetCompany: string;
  targetRole: string;
  difficulty: string;
  focusAreas: string[];
  generatedQuestions: string[];
}

export interface ResumeAnalytics {
  healthScore: number;
  placementReadiness: number;
  interviewReadiness: number;
  history: { date: string; score: number }[];
}

export interface ResumeIntelligence {
  resumeProfile: CareerInsights;
  atsAnalysis?: ATSAnalysis;
  jdAnalysis?: JDAnalysis;
  aiRecommendations?: AIRecommendations;
  interviewContext?: InterviewContext;
  analytics?: ResumeAnalytics;
  metadata: {
    version: string;
    schemaVersion: string;
    provider: string;
    model: string;
    generatedAt: string;
    resumeHash: string;
    promptVersion: string;
    pipelineVersion: string;
    cacheVersion: string;
  };
}

export interface ResumeDocument {
  id: string;
  version: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    targetRole: string;
    templateId: string;
  };
  theme: ThemeSettings;
  typography: TypographySettings;
  layout: any;
  sections: ResumeSection[];
  history: any[];
  intelligence?: ResumeIntelligence;
}

// Ensure backward compatibility during migration
export interface ResumeData extends ResumeDocument {}

export const defaultResumeDocument: ResumeDocument = {
  id: "",
  version: "1.0.0",
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    targetRole: "",
    templateId: "jakes-resume",
  },
  theme: {
    id: "classic",
    primaryColor: "text-black",
    accentColor: "text-gray-600",
    backgroundColor: "bg-white",
    headerStyle: "minimal",
    sectionDivider: "thin",
    bulletStyle: "disc",
    borderRadius: "rounded-none",
    iconPack: "lucide",
    shadow: "none",
  },
  typography: {
    headingFont: "Times New Roman, serif",
    bodyFont: "Times New Roman, serif",
    headingSize: "12pt",
    bodySize: "10pt",
    lineHeight: 1.5,
    letterSpacing: "normal",
    paragraphGap: "0.25rem",
    sectionGap: "0.75rem",
    pageMargins: "1in",
    columns: 1,
  },
  layout: {},
  sections: [
    { id: "personal-1", type: "personal", visible: true, data: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" } },
    { id: "summary-1", type: "summary", visible: true, data: { text: "" } },
    { id: "experience-1", type: "experience", visible: true, data: { items: [] } },
    { id: "projects-1", type: "projects", visible: true, data: { items: [] } },
    { id: "education-1", type: "education", visible: true, data: { items: [] } },
    { id: "skills-1", type: "skills", visible: true, data: { items: [] } },
  ],
  history: [],
};

// Map legacy default to the new document
export const defaultResumeData = defaultResumeDocument;

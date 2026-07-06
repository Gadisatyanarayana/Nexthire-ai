export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewPhase = "setup" | "intro" | "dsa-question" | "coding" | "submitted" | "completed";
export type InterviewLanguage = "javascript" | "python" | "java" | "cpp";

export type VoiceDsaQuestion = {
  id: string;
  title: string;
  description: string;
  functionName: string;
  inputType: string;
  outputType: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
};

export type InterviewSessionConfig = {
  candidateName?: string;
  language: InterviewLanguage;
  difficulty: InterviewDifficulty;
  selfIntroduction: string;
  dsaTopic: string;
  totalDurationMinutes: number;
  companyMode?: string;
  persona?: string;
  jobDescription?: string;
  askedQuestionIds?: string[];
  interviewType?: string;
};

export type InterviewTimeline = {
  phase: InterviewPhase;
  phaseStartedAt: number;
  phaseTimeoutMs: number;
  totalStartedAt: number;
};

export type CodingSubmission = {
  code: string;
  language: InterviewLanguage;
  submittedAt: number;
  executionTime?: number;
};

export type InterviewAnalysis = {
  selfIntroQuality: number;
  codeQuality: number;
  communicationClarity?: number;
  fillerWordScore?: number;
  confidenceScore?: number;
  introTranscriptLength?: number;
  transcript?: string;
  codeFindings?: Array<{
    line: number | null;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
  complexity: {
    time: string;
    space: string;
  };
  improvements: string[];
  strengths: string[];
  aiSuggestions: string[];
  overallScore: number;
  starEvaluation?: any;
  learningRecommendations?: any;
};

export type VoiceInterviewSession = {
  id: string;
  email: string;
  config: InterviewSessionConfig;
  introTranscript?: string;
  timeline: InterviewTimeline;
  dsaQuestion?: VoiceDsaQuestion;
  submission?: CodingSubmission;
  analysis?: InterviewAnalysis;
  createdAt: number;
  aiResponses: Array<{ role: "ai" | "user"; content: string; timestamp: number }>;
};

export function generateSessionId(email: string): string {
  return `voice-interview:${email.toLowerCase()}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getPhaseTimings(_difficulty: InterviewDifficulty): {
  intro: number;
  dsaQuestion: number;
  coding: number;
  total: number;
} {
  // 20-minute interview flow: calm warmup + intro + guided coding.
  const introMs = 3 * 60 * 1000;
  const dsaQuestionMs = 2 * 60 * 1000;
  const codingMs = 15 * 60 * 1000;

  return {
    intro: introMs,
    dsaQuestion: dsaQuestionMs,
    coding: codingMs,
    total: 20 * 60 * 1000,
  };
}

export function getTimerColor(elapsed: number, total: number): string {
  const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
  if (percent < 50) return "#10b981"; // green
  if (percent < 75) return "#f59e0b"; // orange
  return "#ef4444"; // red
}

export function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function shouldAutoTransitionPhase(timeline: InterviewTimeline): boolean {
  const now = Date.now();
  return now - timeline.phaseStartedAt >= timeline.phaseTimeoutMs;
}

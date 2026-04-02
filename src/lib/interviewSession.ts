export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewPhase = "setup" | "intro" | "dsa-question" | "coding" | "submitted" | "completed";
export type InterviewLanguage = "javascript" | "python" | "java" | "cpp";

export type InterviewSessionConfig = {
  language: InterviewLanguage;
  difficulty: InterviewDifficulty;
  selfIntroduction: string;
  dsaTopic: string;
  totalDurationMinutes: 15;
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
  complexity: {
    time: string;
    space: string;
  };
  improvements: string[];
  strengths: string[];
  aiSuggestions: string[];
  overallScore: number;
};

export type VoiceInterviewSession = {
  id: string;
  email: string;
  config: InterviewSessionConfig;
  timeline: InterviewTimeline;
  dsaQuestion?: {
    id: string;
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints: string[];
  };
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
  // All DSA interviews: 15 minutes mandatory
  // 2 minutes intro, remaining for DSA
  const introMs = 2 * 60 * 1000;
  const dsaQuestionMs = 1 * 60 * 1000; // 1 min to ask question
  const codingMs = 12 * 60 * 1000; // 12 minutes for coding

  return {
    intro: introMs,
    dsaQuestion: dsaQuestionMs,
    coding: codingMs,
    total: 15 * 60 * 1000,
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

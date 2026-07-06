export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & {
  isFinal?: boolean;
};

export type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewPhase = "setup" | "permissions" | "resume" | "settings" | "countdown" | "active" | "scorecard" | "history";
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

export type CompanyMode = "google" | "amazon" | "microsoft" | "tcs" | "infosys" | "meta" | "apple" | "general";

export type RecruiterPersona = "professional" | "friendly" | "tough" | "startup_cto" | "hr_lead";

export type InterviewSessionConfig = {
  candidateName?: string;
  language: InterviewLanguage;
  difficulty: InterviewDifficulty;
  selfIntroduction: string;
  dsaTopic: string;
  totalDurationMinutes: number;
  companyMode?: CompanyMode;
  persona?: RecruiterPersona;
  jobDescription?: string;
  askedQuestionIds?: string[];
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

export type STAREvaluation = {
  situation: { detected: boolean; score: number; evidence: string };
  task: { detected: boolean; score: number; evidence: string };
  action: { detected: boolean; score: number; evidence: string };
  result: { detected: boolean; score: number; evidence: string };
  overallStarScore: number;
  feedback: string;
};

export type InterviewAnalysis = {
  selfIntroQuality: number;
  codeQuality: number;
  communicationClarity?: number;
  fillerWordScore?: number;
  confidenceScore?: number;
  grammarScore?: number;
  pronunciationScore?: number;
  vocabularyScore?: number;
  leadershipScore?: number;
  timeManagementScore?: number;
  professionalismScore?: number;
  starEvaluation?: STAREvaluation;
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
  learningRecommendations?: Array<{
    area: string;
    recommendation: string;
    link: string;
  }>;
  overallScore: number;
  cheatingViolation?: boolean;
  hiringProbability?: "Strong Hire" | "Hire" | "Lean Hire" | "No Hire";
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

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

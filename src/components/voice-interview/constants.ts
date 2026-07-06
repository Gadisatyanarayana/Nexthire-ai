import { CompanyMode, RecruiterPersona } from "./types";

export const RESPONSE_TIMEOUT_MS = 25000;
export const HISTORY_LIMIT = 20;
export const INTERIM_SILENCE_MS = 1200;
export const FINAL_SILENCE_MS = 400;

export const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "actually",
  "basically",
  "literally",
  "sort of",
  "kind of",
];

export type CompanyModeConfig = {
  label: string;
  style: string;
  questionBias: string[];
  difficultyBias: "easy" | "medium" | "hard";
  promptSuffix: string;
};

export const COMPANY_MODES: Record<CompanyMode, CompanyModeConfig> = {
  google: {
    label: "Google",
    style: "Algorithmic depth, system design thinking, Googleyness culture fit",
    questionBias: ["coding", "system_design"],
    difficultyBias: "hard",
    promptSuffix: "Focus on algorithmic optimization, scalability, and Googleyness. Ask about trade-offs and alternative approaches."
  },
  amazon: {
    label: "Amazon",
    style: "Leadership Principles, behavioral STAR, ownership thinking",
    questionBias: ["behavioral", "coding", "system_design"],
    difficultyBias: "medium",
    promptSuffix: "Evaluate using Amazon Leadership Principles. Ask about customer obsession, ownership, and disagree-and-commit."
  },
  microsoft: {
    label: "Microsoft",
    style: "Collaboration, growth mindset, problem solving",
    questionBias: ["coding", "behavioral", "system_design"],
    difficultyBias: "medium",
    promptSuffix: "Focus on collaborative problem solving and growth mindset. Ask about teamwork and learning from failures."
  },
  tcs: {
    label: "TCS",
    style: "Aptitude, verbal reasoning, basic coding, HR",
    questionBias: ["hr", "technical", "coding"],
    difficultyBias: "easy",
    promptSuffix: "Focus on fundamental CS concepts, aptitude-style questions, and professional communication. Suitable for mass hiring."
  },
  infosys: {
    label: "Infosys",
    style: "Analytical thinking, InfyTQ pattern, coding basics",
    questionBias: ["technical", "coding", "hr"],
    difficultyBias: "easy",
    promptSuffix: "Focus on analytical reasoning, basic programming concepts, and situational questions."
  },
  meta: {
    label: "Meta",
    style: "Move fast, system design, coding under pressure",
    questionBias: ["coding", "system_design"],
    difficultyBias: "hard",
    promptSuffix: "Focus on coding efficiency, system design at scale, and quick iteration thinking."
  },
  apple: {
    label: "Apple",
    style: "Attention to detail, user experience thinking, deep technical",
    questionBias: ["coding", "technical", "behavioral"],
    difficultyBias: "hard",
    promptSuffix: "Focus on attention to detail, code quality, user-centric thinking, and deep technical understanding."
  },
  general: {
    label: "General Practice",
    style: "Balanced across all categories",
    questionBias: ["technical", "coding", "behavioral", "hr"],
    difficultyBias: "medium",
    promptSuffix: "Balanced interview covering technical, behavioral, and HR topics."
  }
};

export type PersonaConfig = {
  label: string;
  traits: string;
  voiceRate: number;
  voicePitch: number;
  greetingStyle: string;
};

export const PERSONAS: Record<RecruiterPersona, PersonaConfig> = {
  professional: {
    label: "Professional Recruiter",
    traits: "Calm, formal, structured. Uses proper interview protocol.",
    voiceRate: 1.0,
    voicePitch: 1.0,
    greetingStyle: "Good day. Thank you for joining. Let's begin with your introduction."
  },
  friendly: {
    label: "Friendly Mentor",
    traits: "Warm, encouraging, supportive. Makes candidate comfortable.",
    voiceRate: 0.95,
    voicePitch: 1.05,
    greetingStyle: "Hey there! Welcome! Don't worry, this is a friendly mock session. Tell me about yourself!"
  },
  tough: {
    label: "Tough Interviewer",
    traits: "Direct, challenging, probes deeply. High standards.",
    voiceRate: 1.1,
    voicePitch: 0.95,
    greetingStyle: "Let's not waste time. Start with a concise self-introduction. I'll be evaluating strictly."
  },
  startup_cto: {
    label: "Startup CTO",
    traits: "Casual, technical, wants practical builders. Values speed and ownership.",
    voiceRate: 1.05,
    voicePitch: 1.0,
    greetingStyle: "Hey! So we're a fast-moving team. Tell me what you've built recently."
  },
  hr_lead: {
    label: "HR Lead",
    traits: "Empathetic, evaluates culture fit, communication, professionalism.",
    voiceRate: 0.95,
    voicePitch: 1.1,
    greetingStyle: "Welcome! I'm here to understand you as a person. Please share a bit about your journey."
  }
};

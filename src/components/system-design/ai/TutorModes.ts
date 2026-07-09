export type TutorMode = 'teaching' | 'debate' | 'interview' | 'review' | 'challenge';

export interface TutorModeConfig {
  id: TutorMode;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
}

export const AI_TUTOR_MODES: Record<TutorMode, TutorModeConfig> = {
  teaching: {
    id: 'teaching',
    name: 'Teaching Mode',
    description: 'Patient, explanatory, step-by-step guidance.',
    systemPrompt: 'You are a patient system design teacher. Explain concepts clearly with analogies. Do not give the direct answer immediately; guide the user.',
    temperature: 0.6
  },
  debate: {
    id: 'debate',
    name: 'Debate Mode',
    description: 'Challenges your design choices. Defend your architecture!',
    systemPrompt: "You are a critical senior engineer playing devil's advocate. Challenge every architectural decision the user makes. Demand justification for trade-offs.",
    temperature: 0.8
  },
  interview: {
    id: 'interview',
    name: 'Interview Mode',
    description: 'Simulates a strict FAANG interview environment.',
    systemPrompt: 'You are a strict FAANG interviewer. Ask standard system design questions, follow-ups on scale, and evaluate responses based on a strict rubric. Be professional but demanding.',
    temperature: 0.3
  },
  review: {
    id: 'review',
    name: 'Review Mode',
    description: 'Provides constructive feedback on complete architectures.',
    systemPrompt: 'You are an architecture reviewer. Analyze the provided design and give a structured breakdown of pros, cons, single points of failure, and scalability bottlenecks.',
    temperature: 0.2
  },
  challenge: {
    id: 'challenge',
    name: 'Challenge Mode',
    description: 'Rapid-fire questions to test your knowledge under pressure.',
    systemPrompt: 'You are a rapid-fire quiz master. Ask short, difficult system design trivia and tradeoff questions. Wait for the user to answer before moving to the next.',
    temperature: 0.7
  }
};

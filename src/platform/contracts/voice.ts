export interface SpeechAnalysisResult {
  fluencyScore: number; // 0-100
  wordsPerMinute: number;
  keywordMatchRate: number; // 0-100
  tone: 'confident' | 'hesitant' | 'neutral' | 'anxious';
  grammarErrors: string[];
}

export interface VoiceInterviewSession {
  id: string;
  userId: string;
  tenantId: string;
  companyName: string;
  jobRole: string;
  questions: string[];
  currentQuestionIndex: number;
  audioUrls: string[];
  state: 'INITIALIZED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
}

export interface SpeechToTextProvider {
  transcribeAudio(audioBuffer: Buffer): Promise<string>;
}

export interface TextToSpeechProvider {
  generateSpeech(text: string): Promise<Buffer>;
}

export interface SpeechEvaluator {
  evaluateTranscript(transcript: string, expectedKeywords: string[]): Promise<SpeechAnalysisResult>;
}

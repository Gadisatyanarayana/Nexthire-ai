export interface WorkingMemory {
  id: string;
  sessionId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>;
}

export interface ConversationMemory {
  userId: string;
  recentSessions: string[];
  summary: string;
}

export interface LearningMemory {
  userId: string;
  weakTopics: string[];
  solvedProblems: string[];
  assessmentsTaken: string[];
}

export interface ProfileMemory {
  userId: string;
  targetCompanies: string[];
  goals: string[];
  preferences: Record<string, any>;
}

export interface OrganizationMemory {
  institutionId: string;
  facultyIds: string[];
  courses: string[];
  placementStatistics: Record<string, any>;
}

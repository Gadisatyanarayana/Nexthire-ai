export interface EventIngestionPayload {
  eventId: string;
  eventType: 'CodingSubmitted.v1' | 'VoiceCompleted.v1' | 'AssessmentCompleted.v1' | 'LearningTopicMastered.v1';
  timestamp: string;
  tenantId: string;
  userId: string;
  metrics: Record<string, number | string | boolean>;
}

export interface CandidateScorecard {
  userId: string;
  tenantId: string;
  learningEfficiencyScore: number;
  retentionScore: number;
  codingCompetencyScore: number;
  voiceFluencyScore: number;
  globalPlacementReadiness: number;
  lastUpdated: Date;
}

export interface InstitutionReport {
  tenantId: string;
  totalActiveStudents: number;
  averagePlacementReadiness: number;
  topPerformingCohorts: string[];
  systemWideAccuracy: number;
  lastCalculatedAt: Date;
}

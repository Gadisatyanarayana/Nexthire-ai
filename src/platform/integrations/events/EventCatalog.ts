/**
 * NextHire AI Event Catalog
 * 
 * Defines the schema and versioning for all outgoing events that external integrations can subscribe to.
 */

export type IntegrationEventType = 
  | 'AssessmentCompleted.v1'
  | 'CodingSubmitted.v1'
  | 'ContestFinished.v1'
  | 'InterviewCompleted.v1'
  | 'AnalyticsUpdated.v1';

export interface IntegrationEvent<T = any> {
  id: string; // Unique event instance ID
  type: IntegrationEventType;
  tenantId: string;
  timestamp: string; // ISO-8601
  payload: T;
}

export const EventCatalog = {
  'AssessmentCompleted.v1': {
    description: 'Fired when a candidate completes an assessment.',
    producer: 'AssessmentContext',
    schema: {
      candidateId: 'string',
      assessmentId: 'string',
      score: 'number',
      passed: 'boolean',
      completedAt: 'string'
    }
  },
  'CodingSubmitted.v1': {
    description: 'Fired when code is executed and graded.',
    producer: 'CodingContext',
    schema: {
      submissionId: 'string',
      problemId: 'string',
      language: 'string',
      status: 'string',
      timeMs: 'number',
      memoryKb: 'number'
    }
  }
};

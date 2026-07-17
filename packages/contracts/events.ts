import { Question } from './question';
import { ImportJob } from './import';

export interface BaseEvent {
  eventId: string;
  timestamp: string;
  emittedByService: string;
}

export interface QuestionCreatedEvent extends BaseEvent {
  type: 'QuestionCreated';
  payload: {
    question: Question;
  };
}

export interface QuestionPublishedEvent extends BaseEvent {
  type: 'QuestionPublished';
  payload: {
    questionId: string;
    versionId: string;
  };
}

export interface ImportCompletedEvent extends BaseEvent {
  type: 'ImportCompleted';
  payload: {
    jobId: string;
    insertedCount: number;
  };
}

export interface ImportRolledBackEvent extends BaseEvent {
  type: 'ImportRolledBack';
  payload: {
    jobId: string;
  };
}

export type DomainEvent = 
  | QuestionCreatedEvent 
  | QuestionPublishedEvent 
  | ImportCompletedEvent 
  | ImportRolledBackEvent;

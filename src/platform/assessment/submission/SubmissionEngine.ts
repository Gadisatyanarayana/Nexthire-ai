/**
 * Event-Sourced Submission Engine
 * Everything is an immutable event. Final answers are derived from event aggregation.
 */

export enum SubmissionEventType {
  TEST_STARTED = 'TEST_STARTED',
  QUESTION_VIEWED = 'QUESTION_VIEWED',
  ANSWER_SELECTED = 'ANSWER_SELECTED',
  ANSWER_CHANGED = 'ANSWER_CHANGED',
  ANSWER_CLEARED = 'ANSWER_CLEARED',
  MARKED_FOR_REVIEW = 'MARKED_FOR_REVIEW',
  CONFIDENCE_LOGGED = 'CONFIDENCE_LOGGED',
  
  // Proctoring/Context Events routed here for temporal analysis
  TAB_SWITCHED = 'TAB_SWITCHED',
  FULLSCREEN_EXITED = 'FULLSCREEN_EXITED',
  PASTE_ATTEMPTED = 'PASTE_ATTEMPTED',
  
  TEST_SUBMITTED = 'TEST_SUBMITTED'
}

export interface SubmissionEvent {
  eventId: string;
  submissionId: string;
  questionId?: string;
  eventType: SubmissionEventType;
  payload: any;
  timestamp: number;
}

export class SubmissionEngine {
  /**
   * Appends an immutable event to the submission ledger
   */
  static async appendEvent(event: SubmissionEvent): Promise<void> {
    // In production, this pushes to a Kafka/Redis queue for high-throughput ingestion
    // e.g. queue.push('submission_events', event);
  }

  /**
   * Replays the event stream to derive the final answers and operational metrics (time spent per question)
   */
  static async aggregateSubmission(submissionId: string): Promise<any> {
    // Event sourcing projection logic
    return { finalAnswers: {}, timeSpentPerQuestion: {}, riskMarkers: [] };
  }
}

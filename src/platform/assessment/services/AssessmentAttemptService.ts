import { AssessmentAttemptRepository, AssessmentAttempt } from '../repositories/AssessmentAttemptRepository';
import { AssessmentAnswerRepository } from '../repositories/AssessmentAnswerRepository';
import { SubmissionEngine } from '../submission/SubmissionEngine';

export class AssessmentAttemptService {
  constructor(
    private attemptRepo: AssessmentAttemptRepository = new AssessmentAttemptRepository(),
    private answerRepo: AssessmentAnswerRepository = new AssessmentAnswerRepository(),
  ) {}

  /**
   * Starts a new assessment attempt.
   */
  async startAttempt(tenantId: string, userId: string, assessmentId: string): Promise<AssessmentAttempt> {
    return this.attemptRepo.createAttempt(tenantId, userId, assessmentId);
  }

  /**
   * Resumes an active attempt.
   */
  async resumeAttempt(tenantId: string, userId: string, assessmentId: string): Promise<AssessmentAttempt | null> {
    return this.attemptRepo.getActiveAttempt(tenantId, userId, assessmentId);
  }

  /**
   * Auto-saves an answer during an attempt.
   */
  async saveAnswer(
    tenantId: string,
    userId: string,
    attemptId: string,
    questionId: string,
    answerData: any,
    timeElapsedSeconds: number
  ): Promise<void> {
    // 1. Update the answer
    await this.answerRepo.upsertAnswer(tenantId, userId, attemptId, questionId, answerData);

    // 2. Update the attempt status to IN_PROGRESS and sync the elapsed time
    await this.attemptRepo.updateAttemptStatus(attemptId, 'IN_PROGRESS', timeElapsedSeconds);
  }

  /**
   * Submits an assessment attempt, transitions it to SUBMITTED, and triggers grading.
   */
  async submitAttempt(
    tenantId: string, 
    userId: string, 
    attemptId: string, 
    timeElapsedSeconds: number
  ): Promise<AssessmentAttempt> {
    
    // 1. Lock the attempt as SUBMITTED
    const submittedAttempt = await this.attemptRepo.updateAttemptStatus(attemptId, 'SUBMITTED', timeElapsedSeconds);

    // 2. Trigger asynchronous or synchronous grading via the Submission Engine
    // (In a highly scalable system, this would drop an event on a queue)
    const gradedAttempt = await SubmissionEngine.aggregateSubmission(attemptId, tenantId, userId);

    // Return the updated attempt (will be refreshed after grading completes)
    return gradedAttempt;
  }
}

/**
 * Assessment Lifecycle Engine (State Machine)
 * Enforces strict transitions across the 14-state lifecycle.
 */

export enum AssessmentState {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  CLOSED = 'CLOSED',
  EVALUATION = 'EVALUATION',
  RESULT_PUBLISHED = 'RESULT_PUBLISHED',
  APPEAL_WINDOW = 'APPEAL_WINDOW',
  FINALIZED = 'FINALIZED',
  ARCHIVED = 'ARCHIVED'
}

export class AssessmentLifecycleService {
  private static readonly VALID_TRANSITIONS: Record<AssessmentState, AssessmentState[]> = {
    [AssessmentState.DRAFT]: [AssessmentState.REVIEW, AssessmentState.ARCHIVED],
    [AssessmentState.REVIEW]: [AssessmentState.APPROVED, AssessmentState.DRAFT], // Rejected goes back to draft
    [AssessmentState.APPROVED]: [AssessmentState.SCHEDULED, AssessmentState.PUBLISHED],
    [AssessmentState.SCHEDULED]: [AssessmentState.PUBLISHED, AssessmentState.DRAFT],
    [AssessmentState.PUBLISHED]: [AssessmentState.LIVE, AssessmentState.CLOSED],
    [AssessmentState.LIVE]: [AssessmentState.PAUSED, AssessmentState.CLOSED],
    [AssessmentState.PAUSED]: [AssessmentState.RESUMED, AssessmentState.CLOSED],
    [AssessmentState.RESUMED]: [AssessmentState.PAUSED, AssessmentState.CLOSED],
    [AssessmentState.CLOSED]: [AssessmentState.EVALUATION],
    [AssessmentState.EVALUATION]: [AssessmentState.RESULT_PUBLISHED],
    [AssessmentState.RESULT_PUBLISHED]: [AssessmentState.APPEAL_WINDOW, AssessmentState.FINALIZED],
    [AssessmentState.APPEAL_WINDOW]: [AssessmentState.FINALIZED],
    [AssessmentState.FINALIZED]: [AssessmentState.ARCHIVED],
    [AssessmentState.ARCHIVED]: [] // Terminal state
  };

  /**
   * Attempts to transition the assessment to the target state.
   * Throws an error if the transition is illegal, enforcing the state machine.
   */
  static validateTransition(currentState: AssessmentState, targetState: AssessmentState): boolean {
    const allowed = this.VALID_TRANSITIONS[currentState];
    
    if (!allowed.includes(targetState)) {
      throw new Error(`Illegal Assessment State Transition: Cannot move from ${currentState} to ${targetState}.`);
    }

    return true;
  }
}

import { AssessmentState } from '../lifecycle/AssessmentStateMachine';

/**
 * Assessment Notification Hooks
 * Listens to state transitions to trigger cross-platform alerts.
 */

export class NotificationHooks {
  /**
   * Fires automatically upon state transitions.
   */
  static async handleTransition(assessmentId: string, fromState: AssessmentState, toState: AssessmentState): Promise<void> {
    
    // Student Notifications
    if (toState === AssessmentState.PUBLISHED) {
      await this.sendToStudents(assessmentId, 'NEW_ASSESSMENT', 'An assessment has been published.');
    }
    
    if (toState === AssessmentState.LIVE) {
      await this.sendToStudents(assessmentId, 'ASSESSMENT_STARTED', 'The assessment is now active.');
    }
    
    if (toState === AssessmentState.RESULT_PUBLISHED) {
      await this.sendToStudents(assessmentId, 'RESULT_PUBLISHED', 'Your results are available for review.');
    }

    // Faculty Notifications
    if (toState === AssessmentState.CLOSED) {
      await this.sendToFaculty(assessmentId, 'ASSESSMENT_CLOSED', 'All submissions collected. Generating analytics...');
    }
    
    if (toState === AssessmentState.FINALIZED) {
      await this.sendToFaculty(assessmentId, 'ANALYTICS_READY', 'Cohort psychometric analytics are ready.');
    }
  }

  // --- External service integrations stubbed ---
  private static async sendToStudents(assessmentId: string, template: string, message: string) {}
  private static async sendToFaculty(assessmentId: string, template: string, message: string) {}
}

import { AssessmentAttemptRepository } from '../repositories/AssessmentAttemptRepository';
import { AssessmentAnswerRepository } from '../repositories/AssessmentAnswerRepository';
import { LearningProgressFacade } from '@/lib/learning/services/ProgressFacade';

export class SubmissionEngine {
  /**
   * Grades a submitted assessment attempt and triggers downstream learning events.
   */
  static async aggregateSubmission(attemptId: string, tenantId: string, userId: string): Promise<any> {
    const attemptRepo = new AssessmentAttemptRepository();
    const answerRepo = new AssessmentAnswerRepository();
    
    // 1. Fetch all answers for the attempt
    const answers = await answerRepo.getAnswersForAttempt(attemptId);
    
    // In a real grading engine, we'd fetch the Assessment Blueprint/Questions to compare answers.
    // For this implementation, we will simulate the grading logic:
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;
    let earnedScore = 0;
    const maxScore = answers.length * 10; // Assume 10 points per question

    answers.forEach(answer => {
      // Mock logic: if answer_data has a value, it's correct (for demonstration)
      if (answer.answer_data && Object.keys(answer.answer_data).length > 0) {
        correctAnswers++;
        earnedScore += 10;
      } else {
        incorrectAnswers++;
      }
    });

    const percentage = maxScore > 0 ? (earnedScore / maxScore) * 100 : 0;
    const isPassed = percentage >= 70; // 70% passing threshold

    // 2. Persist the grading results
    const gradedAttempt = await attemptRepo.completeGrading(attemptId, {
      score: earnedScore,
      maxScore,
      earnedScore,
      isPassed,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unanswered
    });

    // 3. Emit AssessmentCompleted Event -> Orchestrate downstream (Gamification, Analytics, etc.)
    // We use the LearningProgressFacade implemented in Step 5 for this.
    // The attempt's assessment_id is the content_id for the progress tracker.
    if (isPassed) {
      await LearningProgressFacade.markLessonComplete(
        userId, 
        tenantId, 
        gradedAttempt.assessment_id, 
        gradedAttempt.time_elapsed_seconds
      );
    } else {
      // Just auto-save the progress so analytics knows they spent time on it
      await LearningProgressFacade.autoSave(
        userId,
        tenantId,
        gradedAttempt.assessment_id,
        { latestAttempt: attemptId, score: earnedScore },
        gradedAttempt.time_elapsed_seconds
      );
    }

    return gradedAttempt;
  }
}

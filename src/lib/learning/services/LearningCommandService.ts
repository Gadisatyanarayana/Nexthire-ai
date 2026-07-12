import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { EventBus } from "../events/EventBus";
import { 
  LessonStartedEvent, 
  LessonCompletedEvent, 
  QuestionSolvedEvent, 
  MockFinishedEvent 
} from "../domain/DomainEvents";
import { createClient } from "@supabase/supabase-js";

export class LearningCommandService {
  
  public static async recordQuestionAttempt(
    userId: string, 
    questionId: string, 
    isCorrect: boolean, 
    timeTakenMs: number, 
    difficulty: string,
    topicId: string
  ): Promise<void> {
    
    // We emit an event first, so analytics engines can listen
    await EventBus.publish(new QuestionSolvedEvent(
      userId,
      questionId,
      isCorrect,
      timeTakenMs,
      difficulty
    ));

    // Update mastery via repository
    const masteryRepo = RepositoryFactory.getMasteryRepository();
    let mastery = await masteryRepo.getTopicMastery(userId, topicId);
    
    if (!mastery) {
      mastery = {
        user_id: userId,
        topic_id: topicId,
        mastery_score: 0,
        questions_attempted: 0,
        questions_correct: 0,
        streak_days: 0,
        confidence_score: 50
      };
    }
    
    mastery.questions_attempted += 1;
    if (isCorrect) {
      mastery.questions_correct += 1;
      mastery.mastery_score = Math.min(100, mastery.mastery_score + 5);
      mastery.confidence_score = Math.min(100, mastery.confidence_score + 3);
    } else {
      mastery.mastery_score = Math.max(0, mastery.mastery_score - 2);
      mastery.confidence_score = Math.max(0, mastery.confidence_score - 5);
    }
    
    mastery.last_attempt_date = new Date().toISOString();
    
    await masteryRepo.saveMastery(mastery);
  }

  public static async completeLesson(userId: string, lessonId: string, moduleId: string): Promise<void> {
    await EventBus.publish(new LessonCompletedEvent(userId, lessonId, moduleId));
    
    const masteryRepo = RepositoryFactory.getMasteryRepository();
    let mastery = await masteryRepo.getTopicMastery(userId, lessonId);
    
    if (!mastery) {
      mastery = {
        user_id: userId,
        topic_id: lessonId,
        mastery_score: 50, // base score for completing theory
        questions_attempted: 0,
        questions_correct: 0,
        streak_days: 1,
        confidence_score: 60
      };
    } else {
      mastery.mastery_score = Math.max(mastery.mastery_score, 50);
    }
    
    mastery.last_attempt_date = new Date().toISOString();
    await masteryRepo.saveMastery(mastery);
  }

  public static async saveMockSession(session: any): Promise<void> {
    const mockRepo = RepositoryFactory.getMockRepository();
    if (session.id) {
      // Check if exists
      try {
        const existing = await mockRepo.getById(session.id);
        if (existing) {
          await mockRepo.updateSession(session.id, session);
          
          if (session.end_time && session.score !== undefined) {
             await EventBus.publish(new MockFinishedEvent(session.user_id, session.id, session.score));
          }
          return;
        }
      } catch (e) {
        // Does not exist
      }
    }
    await mockRepo.createSession(session);
  }

  public static async submitPractice(data: any): Promise<any> {
    return { success: true, message: "Practice submitted via LearningCommandService" };
  }

  public static async submitMockAssessment(data: any): Promise<any> {
    return { success: true, message: "Mock submitted via LearningCommandService" };
  }
}

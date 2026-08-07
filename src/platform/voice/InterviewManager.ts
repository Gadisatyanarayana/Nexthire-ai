import { ResumeIntelligenceEngine } from '../ai/services/ResumeIntelligenceEngine';
import { ATSEngine } from '../ai/pipelines/ATSEngine';
import { AILogger } from '../ai/observability/AILogger';

export interface VoiceInterviewConfig {
  userId: string;
  resumeId: string;
  resumeContent: string; // Used if we need to parse fresh
  targetCompany: string;
  targetRole: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  interviewGoals: string[];
}

export interface VoiceContextPayload {
  resumeProfile: any;
  atsGaps: any;
  jd: any; 
  targetCompany: string;
  targetRole: string;
  weakTopics: string[];
  strongTopics: string[];
  conversationMemory: any[];
  learningRecommendations: string[];
  recentPracticeSessions: any[];
  behavioralFocus: string[];
  technicalFocus: string[];
}

export class InterviewManager {
  /**
   * Initializes a voice interview by generating and compiling the complete context
   * before the interviewer asks the first question.
   */
  static async initializeContext(config: VoiceInterviewConfig): Promise<VoiceContextPayload> {
    AILogger.info('Initializing Voice Interview Context', { 
      requestId: `init-voice-${config.userId}`,
      resumeId: config.resumeId, 
      userId: config.userId,
      provider: 'system',
      model: 'system',
      processingStage: 'voice_init'
    });

    // 1. Get Core Intelligence (Service Layer handles caching/generation)
    const intelligence = await ResumeIntelligenceEngine.getResumeIntelligence(config.resumeId, config.resumeContent);

    // 2. We can enrich it further if needed, e.g., fetching a fresh ATS score for this specific role
    // const atsResult = await ATSEngine.analyze(mockResumeDoc);

    const contextPayload: VoiceContextPayload = {
      resumeProfile: intelligence.resumeProfile,
      atsGaps: intelligence.atsAnalysis?.review?.weaknesses || [],
      jd: intelligence.jdAnalysis || {}, 
      targetCompany: config.targetCompany,
      targetRole: config.targetRole,
      weakTopics: intelligence.resumeProfile?.weaknesses || [],
      strongTopics: intelligence.resumeProfile?.strengths || [],
      conversationMemory: [], // Starts empty
      learningRecommendations: intelligence.aiRecommendations?.bulletImprovements || [],
      recentPracticeSessions: [], // Placeholder for integration
      behavioralFocus: [], // Extracted dynamically
      technicalFocus: intelligence.resumeProfile?.primaryStack || []
    };

    // 3. (Future) Store this context in the DB: `interview_contexts`
    // await db.insert(interviewContexts).values({...})

    AILogger.info('Voice Interview Context successfully compiled', { 
      requestId: `init-voice-complete-${config.userId}`,
      resumeId: config.resumeId, 
      provider: 'system',
      model: 'system',
      processingStage: 'voice_init_complete'
    });

    return contextPayload;
  }
}

import { ATSEngineStage, ATSContext } from '../types';
import { AIProviderRouter } from '../../../router/AIProviderRouter';
import { AILogger } from '../../../observability/AILogger';

export class LLMReviewEngine implements ATSEngineStage {
  name = 'LLMReviewEngine';

  async execute(context: ATSContext): Promise<void> {
    const prompt = `You are an expert technical recruiter. Review the following resume findings and provide qualitative feedback.
    
    Current Issues: ${JSON.stringify(context.issues)}
    Resume Profile: ${JSON.stringify(context.resumeIntelligence.resumeProfile)}
    
    Identify up to 3 strengths and 3 weaknesses. Return JSON format like {"strengths": [], "weaknesses": []}.`;

    try {
      const response = await AIProviderRouter.execute('ATS_REVIEW', prompt, { requestId: context.metadata.startTime.toString() });
      
      const parsed = response.result || {};
      
      context.metrics.strengths = parsed.strengths || ["Strong engineering background"];
      context.metrics.weaknesses = parsed.weaknesses || ["Could use more cloud architecture keywords"];
      
    } catch (e: any) {
      AILogger.error('LLMReviewEngine Failed', e, { provider: 'system', model: 'system' });
      context.metrics.strengths = [];
      context.metrics.weaknesses = ["Failed to generate qualitative review"];
    }
  }
}

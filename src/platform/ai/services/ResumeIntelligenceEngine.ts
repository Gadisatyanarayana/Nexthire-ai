import { AIProviderRouter } from '../router/AIProviderRouter';
import { AICacheManager } from '../cache/AICacheManager';
import { AILogger } from '../observability/AILogger';
import { ResumeIntelligence } from '../../../components/resume-builder/types';

export class ResumeIntelligenceEngine {
  /**
   * Generates or retrieves the core Resume Intelligence profile.
   * This acts as the single source of truth for downstream consumers (ATS, JD Match, etc.)
   */
  static async getResumeIntelligence(resumeId: string, resumeContent: string, forceRefresh = false): Promise<ResumeIntelligence> {
    const cacheKey = `parse:${resumeId}`; // Hash of content could be better
    
    if (!forceRefresh) {
      const cached = await AICacheManager.get<ResumeIntelligence>('resume-intelligence', cacheKey);
      if (cached) {
        AILogger.info('Resume Intelligence cache hit', { requestId: `cache-${resumeId}`, resumeId, provider: 'cache', model: 'redis' });
        return cached;
      }
    }

    // Call Provider via Router
    const prompt = `Parse the following resume into a comprehensive career profile. 
    Content: ${resumeContent}`;

    try {
      const response = await AIProviderRouter.execute('RESUME_PARSE', prompt, { requestId: `parse-${resumeId}` });
      
      const intelligence: ResumeIntelligence = {
        resumeProfile: response.result.resumeProfile, // Assumed structured parsing
        metadata: {
          version: '1.0',
          schemaVersion: '1.0',
          provider: response.provider,
          model: response.model,
          generatedAt: new Date().toISOString(),
          resumeHash: 'mock-hash',
          promptVersion: 'v1.0',
          pipelineVersion: '1.0',
          cacheVersion: 'v1.0'
        }
      };

      await AICacheManager.set('resume-intelligence', cacheKey, intelligence);
      
      return intelligence;
    } catch (error) {
      AILogger.error('Failed to generate Resume Intelligence', error, { requestId: `error-${resumeId}`, resumeId, provider: 'system', model: 'system' });
      throw error;
    }
  }

  // Other specific capabilities that build on top of ResumeIntelligence
  static async generateCoverLetter(resumeId: string, jdId: string) {
    // ...
  }
}

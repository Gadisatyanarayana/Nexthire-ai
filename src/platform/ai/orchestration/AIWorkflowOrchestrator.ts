import { ResumeIntelligenceEngine } from '../services/ResumeIntelligenceEngine';
import { ATSEngine } from '../pipelines/ats/ATSEngine';
import { ResumeDocument } from '../../../components/resume-builder/types';
import { AILogger } from '../observability/AILogger';
import { AIProviderRouter } from '../router/AIProviderRouter';

export class AIWorkflowOrchestrator {
  /**
   * Orchestrates a multi-step workflow asynchronously.
   * This ensures dependent AI jobs are run in the correct sequence using the common intelligence object.
   */
  static async runFullResumePipeline(resumeId: string, rawText: string, fileHash: string) {
    const requestId = `wf-${resumeId}-${Date.now()}`;
    const parserVersion = 'v1';
    const schemaVersion = 'v4';
    const promptVersion = 'v7';
    
    // Better Cache Keys: resumeHash + parserVersion + promptVersion + schemaVersion
    const cacheKey = `${fileHash}-${parserVersion}-${promptVersion}-${schemaVersion}`;

    AILogger.info('Starting Full AI Workflow', { 
      requestId, 
      resumeId,
      provider: 'orchestrator', 
      model: 'system', 
      pipelineStage: 'workflow_init',
      parserVersion
    });

    try {
      // 1. Single Source of Truth generation (Two steps as per ADR)
      // Step A: Parse raw text into structured ResumeDocument
      const resumeDocOutput = await AIProviderRouter.execute('RESUME_PARSE', `Convert this raw resume into structured JSON:\n\n${rawText}`, { 
        requestId,
        systemInstruction: "You are a Resume Parsing engine. Output strictly JSON matching the ResumeDocument schema."
      });
      
      const resumeDocument = resumeDocOutput.result;

      // Step B: Generate Intelligence from structured Document
      const intelligence = await ResumeIntelligenceEngine.getResumeIntelligence(resumeId, JSON.stringify(resumeDocument), false);

      // 2. Dispatch subsequent downstream tasks concurrently or sequentially depending on dependency
      const [atsResult] = await Promise.all([
        ATSEngine.analyze(resumeDocument, intelligence),
        // JDMatcher.match(intelligence, ...),
        // CareerCoach.generate(intelligence, ...)
      ]);

      AILogger.info('Completed Full AI Workflow', { 
        requestId, 
        resumeId,
        provider: 'orchestrator', 
        model: 'system', 
        pipelineStage: 'workflow_complete'
      });

      return {
        resumeDocument,
        intelligence,
        atsResult
      };

    } catch (error) {
      AILogger.error('AI Workflow Failed', error, { 
        requestId, 
        resumeId,
        provider: 'orchestrator', 
        model: 'system', 
        pipelineStage: 'workflow_error'
      });
      throw error;
    }
  }
}

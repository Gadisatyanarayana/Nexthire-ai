import { ResumeDocument, ResumeIntelligence, ATSAnalysis } from '../../../../components/resume-builder/types';
import { ATSContext } from './types';
import { EngineRegistry } from './registry/EngineRegistry';
import { ATSReportBuilder } from './builders/ATSReportBuilder';
import { AILogger } from '../../observability/AILogger';

export class ATSEngine {
  /**
   * Enterprise Pipeline Orchestrator
   */
  static async analyze(resumeDocument: ResumeDocument, resumeIntelligence: ResumeIntelligence): Promise<ATSAnalysis> {
    const requestId = crypto.randomUUID();
    
    AILogger.info('Starting Enterprise ATS Engine pipeline', { 
      requestId, 
      resumeId: resumeIntelligence.metadata?.resumeHash || 'unknown', 
      provider: 'ats-pipeline', 
      model: 'v2.0' 
    });

    const context: ATSContext = {
      resumeDocument,
      resumeIntelligence,
      issues: [],
      metrics: {} as any,
      scores: {} as any,
      metadata: {
        engineVersion: '2.0.0',
        promptVersion: 'v4',
        startTime: Date.now()
      }
    };

    try {
      // 1. Initialize Pipeline
      const engines = EngineRegistry.getEngines();
      
      // 2. Execute Stages Sequentially (or in parallel groups if optimized)
      for (const engine of engines) {
        AILogger.debug(`Executing ATS Engine Stage: ${engine.name}`, { requestId });
        await engine.execute(context);
        
        // Fail-fast on critical document validation
        if (engine.name === 'DocumentValidationEngine' && context.metrics.documentIsValid === false) {
           AILogger.warn('Document failed validation, aborting pipeline', { requestId });
           break;
        }
      }

      // 3. Build Final Report
      const finalReport = await ATSReportBuilder.build(context);
      
      AILogger.info('ATS Engine Pipeline Complete', { 
        requestId, 
        overallScore: finalReport.overallScore,
        latency: Date.now() - context.metadata.startTime
      });
      
      return finalReport;

    } catch (error: any) {
      AILogger.error('ATS Engine Pipeline Failed', error, { requestId });
      throw error;
    }
  }
}

import { AIWorkflowOrchestrator } from '../orchestration/AIWorkflowOrchestrator';
import { DocumentParser } from '../parsers/DocumentParser';
import crypto from 'crypto';

export class ResumeApplicationService {
  /**
   * Orchestrates application-level business logic before calling the Orchestrator.
   * Isolates the API layer from the AI workflow execution.
   */
  static async processResumeUpload(resumeId: string, fileBuffer: Buffer, mimeType: string) {
    const requestId = `req-${resumeId}-${Date.now()}`;
    
    // 1. Hash the file
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Parse Raw Document
    const rawDoc = await DocumentParser.extractRawText(fileBuffer, mimeType, requestId);
    
    // 3. Execute AI Pipeline (Cached internally based on hash)
    // Note: Orchestrator handles cache check for resumeHash internally, passing fileHash down.
    const results = await AIWorkflowOrchestrator.runFullResumePipeline(
      resumeId,
      rawDoc.text,
      fileHash
    );
    
    // Application-level post-processing or database persistence mappings could go here

    return results;
  }
}

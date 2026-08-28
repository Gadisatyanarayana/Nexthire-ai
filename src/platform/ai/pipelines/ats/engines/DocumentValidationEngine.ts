import { ATSEngineStage, ATSContext } from '../types';

export class DocumentValidationEngine implements ATSEngineStage {
  name = 'DocumentValidationEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument } = context;
    
    let isValid = true;
    if (!resumeDocument.sections || resumeDocument.sections.length === 0) {
      isValid = false;
      context.issues.push({
        category: 'CONTENT',
        severity: 'HIGH',
        issue: 'MISSING_EXPERIENCE',
        context: 'The document appears to be empty or failed to parse correctly.'
      });
    }

    // A real document validation engine might also check for:
    // - Encrypted PDF
    // - Scanned image without text
    // - File size limits
    
    context.metrics.documentIsValid = isValid;
  }
}

import { ATSEngineStage, ATSContext } from '../types';

export class ATSCompatibilityEngine implements ATSEngineStage {
  name = 'ATSCompatibilityEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument } = context;
    
    let deductions = 0;
    const reasons: string[] = [];

    // The parser would normally flag things like multiple columns, images, tables
    // Here we'll simulate a clean layout
    
    // In a real implementation:
    // if (resumeDocument.metadata.layout === 'multi-column') deductions += 20;

    const possible = 100;
    const earned = Math.max(0, possible - deductions);
    
    context.scores.atsCompatibility = { score: earned, earned, possible, reasons };
  }
}

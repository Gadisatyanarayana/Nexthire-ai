import { ATSEngineStage, ATSContext } from '../types';

export class FormattingEngine implements ATSEngineStage {
  name = 'FormattingEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument } = context;
    
    let deductions = 0;
    let bulletCount = 0;
    const reasons: string[] = [];

    const experience = resumeDocument.sections.find(s => s.type === 'experience')?.data;
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach((item: any) => {
        const count = item.achievements?.length || 0;
        bulletCount += count;
        if (count > 6) {
          deductions += 2;
          reasons.push(`Too many bullets for role: ${item.company}`);
          context.issues.push({ category: 'FORMATTING', severity: 'MEDIUM', issue: 'TOO_MANY_BULLETS', context: item.company });
        }
        if (count > 0 && count < 2) {
          deductions += 2;
          reasons.push(`Too few bullets for role: ${item.company}`);
          context.issues.push({ category: 'FORMATTING', severity: 'MEDIUM', issue: 'TOO_FEW_BULLETS', context: item.company });
        }
      });
    }

    if (bulletCount < 5) {
      deductions += 15;
      reasons.push("Insufficient overall experience bullet points");
      context.issues.push({ category: 'FORMATTING', severity: 'HIGH', issue: 'TOO_FEW_BULLETS' });
    }
    
    context.metrics.bulletCount = bulletCount;
    
    const possible = 100;
    const earned = Math.max(0, possible - deductions);
    
    context.scores.formatting = { score: earned, earned, possible, reasons };
    context.metrics.resumeConsistency = earned; // Arbitrary mapping for quality metric
  }
}

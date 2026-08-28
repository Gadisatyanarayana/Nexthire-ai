import { ATSEngineStage, ATSContext } from '../types';

export class ImpactEngine implements ATSEngineStage {
  name = 'ImpactEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument } = context;
    
    let deductions = 0;
    const reasons: string[] = [];

    let quantifiedBullets = 0;
    let totalBullets = 0;
    
    const numberRegex = /\d+%|\$\d+|\b\d+\b/g;

    const experience = resumeDocument.sections.find(s => s.type === 'experience')?.data;
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach((item: any) => {
        item.achievements?.forEach((bullet: string) => {
          totalBullets++;
          if (numberRegex.test(bullet)) {
            quantifiedBullets++;
          }
        });
      });
    }

    const coverage = totalBullets > 0 ? Math.round((quantifiedBullets / totalBullets) * 100) : 0;
    
    if (coverage < 30) {
      deductions += 15;
      reasons.push(`Low quantitative impact (only ${coverage}% of bullets contain metrics)`);
      context.issues.push({ category: 'IMPACT', severity: 'HIGH', issue: 'LOW_IMPACT' });
    } else if (coverage < 50) {
      deductions += 5;
      reasons.push(`Moderate quantitative impact (${coverage}%)`);
    }

    const possible = 100;
    const earned = Math.max(0, possible - deductions);
    
    context.scores.impact = { score: earned, earned, possible, reasons };
    context.metrics.quantifiedBullets = quantifiedBullets;
    context.metrics.actionVerbCoverage = coverage; // Simplified mapping
    context.metrics.resumeProfessionalism = earned;
  }
}

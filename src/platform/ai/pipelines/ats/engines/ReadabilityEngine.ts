import { ATSEngineStage, ATSContext } from '../types';

export class ReadabilityEngine implements ATSEngineStage {
  name = 'ReadabilityEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument } = context;
    
    let deductions = 0;
    const reasons: string[] = [];

    let totalWords = 0;
    let longBullets = 0;
    let shortBullets = 0;

    const experience = resumeDocument.sections.find(s => s.type === 'experience')?.data;
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach((item: any) => {
        item.achievements?.forEach((bullet: string) => {
          const wordCount = bullet.split(/\s+/).length;
          totalWords += wordCount;
          if (wordCount > 40) {
            longBullets++;
          }
          if (wordCount < 5) {
            shortBullets++;
          }
        });
      });
    }

    if (longBullets > 0) {
      deductions += longBullets * 3;
      reasons.push(`${longBullets} bullet(s) are overly long (>40 words)`);
      context.issues.push({ category: 'READABILITY', severity: 'MEDIUM', issue: 'POOR_READABILITY', context: 'Bullets too long' });
    }

    if (shortBullets > 0) {
      deductions += shortBullets * 2;
      reasons.push(`${shortBullets} bullet(s) are too short (<5 words)`);
      context.issues.push({ category: 'READABILITY', severity: 'LOW', issue: 'POOR_READABILITY', context: 'Bullets too short' });
    }

    const possible = 100;
    const earned = Math.max(0, possible - deductions);
    
    context.scores.readability = { score: earned, earned, possible, reasons };
  }
}

import { ATSEngineStage, ATSContext } from '../types';

export class RuleEngine implements ATSEngineStage {
  name = 'RuleEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument } = context;
    
    let deductions = 0;
    const reasons: string[] = [];

    const personal = resumeDocument.sections.find(s => s.type === 'personal')?.data;
    if (!personal?.email) {
      deductions += 10;
      reasons.push("Missing email address");
      context.issues.push({ category: 'CONTENT', severity: 'HIGH', issue: 'NO_EMAIL' });
    }
    
    if (!personal?.phone) {
      deductions += 5;
      reasons.push("Missing phone number");
      context.issues.push({ category: 'CONTENT', severity: 'HIGH', issue: 'NO_PHONE' });
    }
    
    if (!personal?.linkedin) {
      deductions += 5;
      reasons.push("Missing LinkedIn profile");
      context.issues.push({ category: 'CONTENT', severity: 'HIGH', issue: 'NO_LINKEDIN' });
    }

    if (!resumeDocument.sections.find(s => s.type === 'experience')) {
      deductions += 30;
      reasons.push("Missing Experience section");
      context.issues.push({ category: 'CONTENT', severity: 'HIGH', issue: 'MISSING_EXPERIENCE' });
    }
    
    if (!resumeDocument.sections.find(s => s.type === 'education')) {
      deductions += 10;
      reasons.push("Missing Education section");
      context.issues.push({ category: 'CONTENT', severity: 'MEDIUM', issue: 'MISSING_EDUCATION' });
    }

    const possible = 100;
    const earned = Math.max(0, possible - deductions);
    
    context.scores.content = { score: earned, earned, possible, reasons };
    context.metrics.resumeCompleteness = earned;
  }
}

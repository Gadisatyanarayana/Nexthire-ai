import { ATSEngineStage, ATSContext } from '../types';
import fs from 'fs';
import path from 'path';

export class KeywordEngine implements ATSEngineStage {
  name = 'KeywordEngine';

  async execute(context: ATSContext): Promise<void> {
    const { resumeDocument, resumeIntelligence } = context;
    
    let deductions = 0;
    const reasons: string[] = [];

    const targetRoles = resumeIntelligence.resumeProfile.targetRoles || [];
    const stack = resumeIntelligence.resumeProfile.primaryStack || [];
    
    // Load synonyms
    let synonyms: Record<string, string[]> = {};
    try {
      const dataPath = path.join(process.cwd(), 'src', 'platform', 'ai', 'pipelines', 'ats', 'data', 'synonyms.json');
      if (fs.existsSync(dataPath)) {
        synonyms = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      }
    } catch (e) {
      console.warn("Failed to load synonyms.json", e);
    }

    // A real implementation would scan the raw text for these normalized keywords
    // Here we'll do a basic check on the extracted stack length
    if (stack.length < 3) {
      deductions += 20;
      reasons.push("Very few technical skills identified");
      context.issues.push({ category: 'KEYWORDS', severity: 'HIGH', issue: 'LACKING_KEYWORDS' });
    }

    const possible = 100;
    const earned = Math.max(0, possible - deductions);
    
    context.scores.keywords = { score: earned, earned, possible, reasons };
    
    context.metrics.keywordDensity = stack.length * 2;
    context.metrics.missingKeywords = []; // Example empty array for now
    context.metrics.resumeTechnicalStrength = earned;
  }
}

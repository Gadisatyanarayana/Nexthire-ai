import { ATSContext } from '../types';
import fs from 'fs';
import path from 'path';

export class RecommendationEngine {
  static async build(context: ATSContext): Promise<any[]> {
    let recConfig: Record<string, any> = {};
    try {
      const dataPath = path.join(process.cwd(), 'src', 'platform', 'ai', 'pipelines', 'ats', 'data', 'recommendations.json');
      if (fs.existsSync(dataPath)) {
        recConfig = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      }
    } catch (e) {
      console.warn("Failed to load recommendations.json", e);
    }

    const uniqueIssues = new Set<string>();
    const recommendations: any[] = [];

    for (const issue of context.issues) {
      if (!uniqueIssues.has(issue.issue)) {
        uniqueIssues.add(issue.issue);
        const mapping = recConfig[issue.issue];
        if (mapping) {
          recommendations.push({
            priority: mapping.priority,
            effort: mapping.effort,
            impact: mapping.impact,
            text: mapping.text
          });
        }
      }
    }

    return recommendations;
  }
}

import { ATSContext } from '../types';
import fs from 'fs';
import path from 'path';

export class ScoringEngine {
  static async build(context: ATSContext, targetRole: string = 'DEFAULT'): Promise<{ overallScore: number, percentile: number, target: string }> {
    let benchmarks: Record<string, any> = {};
    try {
      const dataPath = path.join(process.cwd(), 'src', 'platform', 'ai', 'pipelines', 'ats', 'data', 'benchmarks.json');
      if (fs.existsSync(dataPath)) {
        benchmarks = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      }
    } catch (e) {
      console.warn("Failed to load benchmarks.json", e);
    }

    const scores = context.scores;
    
    // Weights (could also be dynamic)
    const weights = {
      content: 0.35,
      formatting: 0.15,
      readability: 0.10,
      keywords: 0.20,
      impact: 0.10,
      atsCompatibility: 0.10
    };

    let overallScore = 0;
    overallScore += (scores.content?.score || 0) * weights.content;
    overallScore += (scores.formatting?.score || 0) * weights.formatting;
    overallScore += (scores.readability?.score || 0) * weights.readability;
    overallScore += (scores.keywords?.score || 0) * weights.keywords;
    overallScore += (scores.impact?.score || 0) * weights.impact;
    overallScore += (scores.atsCompatibility?.score || 0) * weights.atsCompatibility;
    
    overallScore = Math.round(overallScore);

    // Benchmarking
    let target = targetRole;
    let bench = benchmarks[targetRole];
    if (!bench) {
      bench = benchmarks['DEFAULT'];
      target = 'DEFAULT';
    }

    // Very simple heuristic percentile calculation
    let percentile = 50;
    if (bench) {
      const diff = overallScore - bench.overall;
      percentile = Math.max(1, Math.min(99, 50 + (diff * 2)));
    }

    return { overallScore, percentile, target };
  }
}

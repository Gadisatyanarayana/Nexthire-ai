import { ATSContext } from '../types';
import { ATSAnalysis } from '../../../../../components/resume-builder/types';
import { ScoringEngine } from './ScoringEngine';
import { RecommendationEngine } from './RecommendationEngine';

export class ATSReportBuilder {
  static async build(context: ATSContext): Promise<ATSAnalysis> {
    
    // 1. Resolve Scores & Benchmarking
    const targetRole = context.resumeIntelligence.resumeProfile?.targetRoles?.[0] || 'DEFAULT';
    const { overallScore, percentile, target } = await ScoringEngine.build(context, targetRole);
    
    // 2. Resolve Recommendations
    const recommendations = await RecommendationEngine.build(context);
    
    // 3. Assemble Statistics
    const statistics = {
      bulletCount: context.metrics.bulletCount || 0,
      quantifiedBullets: context.metrics.quantifiedBullets || 0,
      actionVerbCoverage: context.metrics.actionVerbCoverage || 0,
      keywordDensity: context.metrics.keywordDensity || 0
    };
    
    // 4. Quality Metrics
    const qualityMetrics = {
      resumeCompleteness: context.metrics.resumeCompleteness || 0,
      resumeConsistency: context.metrics.resumeConsistency || 0,
      resumeProfessionalism: context.metrics.resumeProfessionalism || 0,
      resumeTechnicalStrength: context.metrics.resumeTechnicalStrength || 0
    };

    // 5. Versioning
    const version = {
      reportVersion: 1, // Future: fetch from DB history
      resumeVersion: 1, // Future: fetch from DB document history
      engineVersion: context.metadata.engineVersion,
      promptVersion: context.metadata.promptVersion,
      generatedAt: new Date(context.metadata.startTime).toISOString()
    };

    return {
      overallScore,
      confidence: 0.95, // Hardcoded for Sprint 2
      percentile,
      target,
      dimensionScores: context.scores as any,
      qualityMetrics,
      strengths: context.metrics.strengths || [],
      weaknesses: context.metrics.weaknesses || [],
      recommendations,
      missingKeywords: context.metrics.missingKeywords || [],
      duplicateBullets: context.metrics.duplicateBullets || [],
      statistics,
      version
    };
  }
}

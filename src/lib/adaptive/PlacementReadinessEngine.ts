/**
 * Placement Readiness Engine (Phase 5)
 * Computes holistic placement readiness scores based on diverse assessment metrics.
 */

export interface CandidateMetrics {
  topicMasteryAvg: number; // 0-100
  mcqAccuracy: number; // 0-100
  caseStudiesCompleted: number; // 0-22
  aiMentorScore: number; // 0-100
  timeConsistencyScore: number; // 0-100
  aiMockInterviewAvg: number; // 0-100
  codingInterviewAvg: number; // 0-100
  systemDesignInterviewAvg: number; // 0-100
  resumeMatchScore: number; // 0-100
  adaptiveRevisionConsistency: number; // 0-100
  weakTopicRecoveryRate: number; // 0-100
  knowledgeRetentionScore: number; // 0-100
}

export interface PlacementReadinessResult {
  overallPlacementScore: number;
  faangScore: number;
  productCompanyScore: number;
  serviceCompanyScore: number;
  interviewConfidenceScore: number;
  learningConsistencyScore: number;
  readinessLabel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Interview Ready' | 'FAANG Ready';
}

export class PlacementReadinessEngine {
  
  /**
   * Calculates all placement readiness metrics.
   */
  public static calculateReadiness(metrics: CandidateMetrics): PlacementReadinessResult {
    // 1. Overall Placement Score (Weighted Average)
    const overallScore = (
      (metrics.topicMasteryAvg * 0.15) +
      (metrics.mcqAccuracy * 0.10) +
      ((metrics.caseStudiesCompleted / 22 * 100) * 0.10) +
      (metrics.aiMockInterviewAvg * 0.20) +
      (metrics.codingInterviewAvg * 0.15) +
      (metrics.systemDesignInterviewAvg * 0.15) +
      (metrics.knowledgeRetentionScore * 0.10) +
      (metrics.weakTopicRecoveryRate * 0.05)
    );

    // 2. FAANG Score (Heavily weights System Design, Coding, and AI Mock Interviews)
    const faangScore = (
      (metrics.systemDesignInterviewAvg * 0.35) +
      (metrics.codingInterviewAvg * 0.30) +
      (metrics.aiMockInterviewAvg * 0.25) +
      (metrics.resumeMatchScore * 0.10)
    );

    // 3. Product Company Score (Balances practical system design with strong coding)
    const productCompanyScore = (
      (metrics.systemDesignInterviewAvg * 0.25) +
      (metrics.codingInterviewAvg * 0.25) +
      (metrics.aiMockInterviewAvg * 0.20) +
      (metrics.topicMasteryAvg * 0.20) +
      (metrics.mcqAccuracy * 0.10)
    );

    // 4. Service Company Score (Heavily weights MCQs, Mastery, and General Interviews)
    const serviceCompanyScore = (
      (metrics.mcqAccuracy * 0.30) +
      (metrics.topicMasteryAvg * 0.30) +
      (metrics.aiMockInterviewAvg * 0.20) +
      (metrics.resumeMatchScore * 0.20)
    );

    // 5. Interview Confidence Score (Based on mock interviews and mentor reviews)
    const interviewConfidenceScore = (
      (metrics.aiMockInterviewAvg * 0.50) +
      (metrics.aiMentorScore * 0.30) +
      (metrics.weakTopicRecoveryRate * 0.20)
    );

    // 6. Learning Consistency Score (Based on tracking and retention metrics)
    const learningConsistencyScore = (
      (metrics.timeConsistencyScore * 0.40) +
      (metrics.adaptiveRevisionConsistency * 0.40) +
      (metrics.knowledgeRetentionScore * 0.20)
    );

    return {
      overallPlacementScore: this.clamp(overallScore),
      faangScore: this.clamp(faangScore),
      productCompanyScore: this.clamp(productCompanyScore),
      serviceCompanyScore: this.clamp(serviceCompanyScore),
      interviewConfidenceScore: this.clamp(interviewConfidenceScore),
      learningConsistencyScore: this.clamp(learningConsistencyScore),
      readinessLabel: this.getReadinessLabel(this.clamp(overallScore), this.clamp(faangScore))
    };
  }

  private static clamp(value: number): number {
    return parseFloat(Math.max(0, Math.min(100, value)).toFixed(2));
  }

  private static getReadinessLabel(overallScore: number, faangScore: number): PlacementReadinessResult['readinessLabel'] {
    if (faangScore >= 85 && overallScore >= 85) return 'FAANG Ready';
    if (overallScore >= 75) return 'Interview Ready';
    if (overallScore >= 60) return 'Advanced';
    if (overallScore >= 40) return 'Intermediate';
    return 'Beginner';
  }
}

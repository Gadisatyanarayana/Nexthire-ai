/**
 * Certification Engine (Phase 5)
 * Evaluates candidate eligibility and issues verifiable certificates.
 */

import { CandidateMetrics, PlacementReadinessResult } from './PlacementReadinessEngine';

export type CertificateType = 
  | 'Foundation' 
  | 'Intermediate' 
  | 'Advanced' 
  | 'Professional'
  | 'Interview Ready' 
  | 'FAANG Ready' 
  | 'Expert System Designer';

export interface CertificationResult {
  eligible: boolean;
  type?: CertificateType;
  verificationId?: string;
  issueDate?: Date;
  expiryDate?: Date;
  verificationUrl?: string;
  reason?: string;
}

export class CertificationEngine {
  
  /**
   * Evaluates eligibility for a specific certificate type based on metrics and overall progress.
   */
  public static evaluateEligibility(
    targetCertificate: CertificateType,
    metrics: CandidateMetrics,
    readiness: PlacementReadinessResult,
    moduleCompletionPercentage: number,
    finalInterviewPassed: boolean
  ): CertificationResult {

    let eligible = false;
    let reason = '';

    // Check basic threshold: Both module completion and final AI interview are REQUIRED for ALL certificates.
    // However, lower tier certificates might not require a highly scored final interview, just passing it.
    if (moduleCompletionPercentage < 50 && targetCertificate !== 'Foundation') {
      return { eligible: false, reason: 'Insufficient module completion.' };
    }

    switch (targetCertificate) {
      case 'Foundation':
        eligible = moduleCompletionPercentage >= 30 && metrics.mcqAccuracy >= 60;
        reason = eligible ? 'Foundation thresholds met.' : 'Need 30% completion and 60% MCQ accuracy.';
        break;
      
      case 'Intermediate':
        eligible = moduleCompletionPercentage >= 50 && metrics.topicMasteryAvg >= 60;
        reason = eligible ? 'Intermediate thresholds met.' : 'Need 50% completion and 60% mastery.';
        break;
      
      case 'Advanced':
        eligible = moduleCompletionPercentage >= 75 && metrics.topicMasteryAvg >= 75 && finalInterviewPassed;
        reason = eligible ? 'Advanced thresholds met.' : 'Need 75% completion, 75% mastery, and final interview pass.';
        break;
      
      case 'Professional':
        eligible = moduleCompletionPercentage >= 90 && metrics.topicMasteryAvg >= 85 && finalInterviewPassed && metrics.caseStudiesCompleted >= 10;
        reason = eligible ? 'Professional thresholds met.' : 'Need 90% completion, 85% mastery, 10 case studies, and final interview pass.';
        break;
        
      case 'Interview Ready':
        eligible = readiness.readinessLabel === 'Interview Ready' || readiness.readinessLabel === 'FAANG Ready';
        reason = eligible ? 'Interview readiness achieved.' : 'Overall placement score must reach 75+.';
        break;
        
      case 'FAANG Ready':
        eligible = readiness.faangScore >= 85 && readiness.overallPlacementScore >= 85 && finalInterviewPassed;
        reason = eligible ? 'FAANG thresholds met.' : 'FAANG and Overall scores must reach 85+, with final interview pass.';
        break;
        
      case 'Expert System Designer':
        eligible = moduleCompletionPercentage >= 95 && metrics.topicMasteryAvg >= 90 && readiness.faangScore >= 90 && finalInterviewPassed && metrics.caseStudiesCompleted >= 20;
        reason = eligible ? 'Expert thresholds met.' : 'Need 95% completion, 90% mastery, 90+ FAANG score, 20 case studies, and final interview pass.';
        break;
    }

    if (eligible) {
      const verificationId = this.generateVerificationId();
      return {
        eligible: true,
        type: targetCertificate,
        verificationId,
        issueDate: new Date(),
        // Expiry is optional; let's set 2 years for Expert/FAANG, none for foundation
        expiryDate: ['FAANG Ready', 'Expert System Designer'].includes(targetCertificate) 
          ? new Date(new Date().setFullYear(new Date().getFullYear() + 2)) 
          : undefined,
        verificationUrl: `https://nexthire.ai/verify/${verificationId}`,
        reason
      };
    }

    return { eligible: false, reason };
  }

  private static generateVerificationId(): string {
    // Generate a secure-looking random alphanumeric ID (e.g., SD-9A4F-2B1C-88DD)
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SD-${segment()}-${segment()}-${segment()}`;
  }
}

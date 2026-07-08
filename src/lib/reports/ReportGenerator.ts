/**
 * Report Generator (Phase 5)
 * Handles the compilation of learning data into downloadable formats (JSON, CSV, PDF structure).
 */

import { CandidateMetrics, PlacementReadinessResult } from '../adaptive/PlacementReadinessEngine';
import { CertificationResult } from '../adaptive/CertificationEngine';

export interface ReportData {
  userId: string;
  generatedAt: Date;
  metrics: CandidateMetrics;
  readiness: PlacementReadinessResult;
  certificates: CertificationResult[];
  recommendations: string[];
}

export class ReportGenerator {
  
  /**
   * Generates a structured JSON report for direct API consumption.
   */
  public static generateJSON(data: ReportData): string {
    return JSON.stringify({
      version: '1.0',
      reportType: 'PlacementReadiness',
      ...data
    }, null, 2);
  }

  /**
   * Generates a CSV format report of key metrics.
   */
  public static generateCSV(data: ReportData): string {
    const headers = [
      'Metric',
      'Score'
    ];
    
    const rows = [
      ['Topic Mastery Avg', data.metrics.topicMasteryAvg],
      ['MCQ Accuracy', data.metrics.mcqAccuracy],
      ['Case Studies', data.metrics.caseStudiesCompleted],
      ['Overall Placement Score', data.readiness.overallPlacementScore],
      ['FAANG Score', data.readiness.faangScore],
      ['Interview Confidence', data.readiness.interviewConfidenceScore],
      ['Label', data.readiness.readinessLabel]
    ];

    return [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
  }

  /**
   * Generates a structured object representing the PDF layout model.
   * Actual PDF rendering using jsPDF or pdfmake would consume this structure on the client/edge.
   */
  public static buildPDFLayoutModel(data: ReportData) {
    return {
      title: 'System Design Placement Readiness Report',
      date: data.generatedAt.toISOString(),
      sections: [
        {
          heading: 'Executive Summary',
          content: `Candidate has achieved an overall placement score of ${data.readiness.overallPlacementScore}, resulting in a label of ${data.readiness.readinessLabel}.`
        },
        {
          heading: 'Company Scores',
          data: {
            'FAANG Score': data.readiness.faangScore,
            'Product Company Score': data.readiness.productCompanyScore,
            'Service Company Score': data.readiness.serviceCompanyScore
          }
        },
        {
          heading: 'Certificates Earned',
          content: data.certificates.length > 0 
            ? data.certificates.map(c => `- ${c.type} (Verified: ${c.verificationId})`).join('\n')
            : 'No certificates earned yet.'
        },
        {
          heading: 'Actionable Recommendations',
          content: data.recommendations.map(r => `- ${r}`).join('\n')
        }
      ]
    };
  }
}

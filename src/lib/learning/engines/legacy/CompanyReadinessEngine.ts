import { CompanyConfig } from "./CompanyEngine";
import { MockAnalyticsResult } from "./MockAnalyticsEngine";

export interface ReadinessResult {
  company_id: string;
  readiness_percentage: number;
  interview_probability: "Low" | "Medium" | "High";
  estimated_cutoff: number;
  topic_readiness: Record<string, number>;
  weak_topics: string[];
  strong_topics: string[];
}

export class CompanyReadinessEngine {
  public static calculateReadiness(
    company: CompanyConfig,
    topicMastery: { topic_name: string; mastery_score: number }[],
    recentMocks: MockAnalyticsResult[]
  ): ReadinessResult {
    // 1. Calculate base readiness from mastery mapped to company weights
    let totalWeight = 0;
    let weightedMasteryScore = 0;

    Object.entries(company.topic_weightage).forEach(([topic, weight]) => {
      const mastery = topicMastery.find(t => t.topic_name === topic)?.mastery_score || 0;
      weightedMasteryScore += mastery * (weight / 100);
      totalWeight += weight;
    });

    const normalizedMasteryScore = totalWeight > 0 ? (weightedMasteryScore / (totalWeight / 100)) : 0;

    // 2. Factor in Mock Scores (if any)
    let finalReadiness = normalizedMasteryScore;
    if (recentMocks.length > 0) {
      // Weight mock scores heavily since they simulate the real environment
      const avgMockScore = recentMocks.reduce((acc, m) => acc + m.overall_score, 0) / recentMocks.length;
      finalReadiness = (normalizedMasteryScore * 0.4) + (avgMockScore * 0.6);
    }

    // Determine probability
    let probability: "Low" | "Medium" | "High" = "Low";
    if (finalReadiness >= company.estimated_cutoff_percentage + 5) {
      probability = "High";
    } else if (finalReadiness >= company.estimated_cutoff_percentage - 10) {
      probability = "Medium";
    }

    // Sort weak/strong based on mastery
    const topicReadiness: Record<string, number> = {};
    const weak: string[] = [];
    const strong: string[] = [];

    topicMastery.forEach(t => {
      topicReadiness[t.topic_name] = t.mastery_score;
      if (t.mastery_score < 50) weak.push(t.topic_name);
      else if (t.mastery_score > 80) strong.push(t.topic_name);
    });

    return {
      company_id: company.id,
      readiness_percentage: Math.min(Math.round(finalReadiness), 100),
      interview_probability: probability,
      estimated_cutoff: company.estimated_cutoff_percentage,
      topic_readiness: topicReadiness,
      weak_topics: weak,
      strong_topics: strong
    };
  }
}

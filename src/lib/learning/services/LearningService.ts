import { LearningQueryService } from './LearningQueryService';
import { LearningCommandService } from './LearningCommandService';

// Import all legacy engines to proxy them through the facade
import { AnalyticsEngine } from "../engines/legacy/AnalyticsEngine";
import { MockAnalyticsEngine } from "../engines/legacy/MockAnalyticsEngine";
import { PlacementReadinessEngine } from "../engines/legacy/PlacementReadinessEngine";
import { QuizGenerator } from "../engines/legacy/QuizGenerator";
import { ReportingEngine } from "../engines/legacy/ReportingEngine";
import { AdaptiveLearningEngine } from "../engines/legacy/AdaptiveLearningEngine";
import { SpacedRepetitionEngine } from "../engines/legacy/SpacedRepetitionEngine";
import { WeakTopicCoach } from "../engines/legacy/WeakTopicCoach";
import { MockTestEngine } from "../engines/legacy/MockTestEngine";
import { AIReviewEngine } from "../engines/legacy/AIReviewEngine";
import { CertificationEngine } from "../engines/legacy/CertificationEngine";
import { CompanyReadinessEngine } from "../engines/legacy/CompanyReadinessEngine";
import { GamificationEngine } from "../engines/legacy/GamificationEngine";
import { HintEngine } from "../engines/legacy/HintEngine";
import { AITutorEngine } from "../engines/legacy/AITutorEngine";
import { QuestionEngine } from "../engines/legacy/QuestionEngine";
import { KnowledgeGraphEngine } from "../engines/legacy/KnowledgeGraphEngine";
import { SmartRevisionEngine } from "../engines/legacy/SmartRevisionEngine";
import { CompanyEngine } from "../engines/legacy/CompanyEngine";
import { FeatureFlags } from "../engines/legacy/FeatureFlags";
import { FormulaEngine } from "../engines/legacy/FormulaEngine";
import { MemoryManager } from "../engines/legacy/MemoryManager";

export class LearningService {
  public static readonly queries = LearningQueryService;
  public static readonly commands = LearningCommandService;

  // Temporary facade proxies to migrate API routes safely
  public static get AnalyticsEngine() {
    return AnalyticsEngine;
  }
  public static get MockAnalyticsEngine() { return MockAnalyticsEngine; }
  public static get PlacementReadinessEngine() { return PlacementReadinessEngine; }
  public static get QuizGenerator() { return QuizGenerator; }
  public static get ReportingEngine() { return ReportingEngine; }
  public static get AdaptiveLearningEngine() { return AdaptiveLearningEngine; }
  public static get SpacedRepetitionEngine() { return SpacedRepetitionEngine; }
  public static get WeakTopicCoach() { return WeakTopicCoach; }
  public static get MockTestEngine() { return MockTestEngine; }
  public static get AIReviewEngine() { return AIReviewEngine; }
  public static get CertificationEngine() { return CertificationEngine; }
  public static get CompanyReadinessEngine() { return CompanyReadinessEngine; }
  public static get GamificationEngine() { return GamificationEngine; }
  public static get HintEngine() { return HintEngine; }
  public static get AITutorEngine() { return AITutorEngine; }
  public static get QuestionEngine() { return QuestionEngine; }
  public static get KnowledgeGraphEngine() { return KnowledgeGraphEngine; }
  public static get SmartRevisionEngine() { return SmartRevisionEngine; }
  public static get CompanyEngine() { return CompanyEngine; }
  public static get FeatureFlags() { return FeatureFlags; }
  public static get FormulaEngine() { return FormulaEngine; }
  public static get MemoryManager() { return MemoryManager; }
}



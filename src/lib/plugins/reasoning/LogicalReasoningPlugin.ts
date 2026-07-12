import { IPlugin, PluginManifest, PluginCapabilities, PluginState } from "../../learning/kernel/PluginState";
import { DependencyContainer } from "../../learning/framework/DependencyContainer";
import { 
  SupabaseReasoningLessonRepository, 
  SupabaseReasoningQuestionRepository, 
  SupabaseReasoningMockRepository, 
  SupabaseReasoningMasteryRepository, 
  SupabaseReasoningCompanyRepository 
} from "./SupabaseReasoningRepositories";

export class LogicalReasoningPlugin implements IPlugin {
  private state: PluginState = PluginState.REGISTERED;

  public getManifest(): PluginManifest {
    return {
      id: "plugin.logical-reasoning",
      version: "1.0.0",
      schemaVersion: "1.0",
      contentVersion: "1.0",
      displayName: "Logical Reasoning",
      capabilities: {
        hasLearning: true,
        hasPractice: true,
        hasMockTests: true,
        hasCompanyPrep: true,
        hasAIIntegration: true,
        hasCertificates: true,
        hasGamification: true,
        hasAnalytics: true,
        hasRevision: true,
        hasRoadmap: true,
        hasSearch: true
      },
      dependencies: ["plugin.core"],
      minimumKernelVersion: "1.0",
      minimumDatabaseVersion: "1.0",
      apiVersion: "v1"
    };
  }

  public async initialize(): Promise<void> {
    this.state = PluginState.INITIALIZING;
    try {
      console.log("[LogicalReasoningPlugin] Initializing...");
      
      // Register Reasoning Repositories
      DependencyContainer.register("IReasoningLessonRepository", new SupabaseReasoningLessonRepository());
      DependencyContainer.register("IReasoningQuestionRepository", new SupabaseReasoningQuestionRepository());
      DependencyContainer.register("IReasoningMockRepository", new SupabaseReasoningMockRepository());
      DependencyContainer.register("IReasoningMasteryRepository", new SupabaseReasoningMasteryRepository());
      DependencyContainer.register("IReasoningCompanyRepository", new SupabaseReasoningCompanyRepository());

      this.state = PluginState.READY;
      console.log("[LogicalReasoningPlugin] Ready.");
    } catch (e) {
      this.state = PluginState.FAILED;
      console.error("[LogicalReasoningPlugin] Failed to initialize", e);
    }
  }

  public getState(): PluginState {
    return this.state;
  }

  public async shutdown(): Promise<void> {
    console.log("[LogicalReasoningPlugin] Shutting down...");
    this.state = PluginState.DISABLED;
  }
}

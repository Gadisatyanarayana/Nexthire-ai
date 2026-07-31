import { IPlugin, PluginManifest, PluginState } from "../../learning/kernel/PluginState";
import { DependencyContainer } from "../../learning/framework/DependencyContainer";
import { 
  SupabaseVerbalLessonRepository, 
  SupabaseVerbalQuestionRepository, 
  SupabaseVerbalMockRepository, 
  SupabaseVerbalMasteryRepository, 
  SupabaseVerbalCompanyRepository 
} from "./SupabaseVerbalRepositories";

export class VerbalAbilityPlugin implements IPlugin {
  private state: PluginState = PluginState.REGISTERED;

  public getManifest(): PluginManifest {
    return {
      id: "plugin.verbal-ability",
      version: "1.0.0",
      schemaVersion: "1.0",
      contentVersion: "1.0",
      displayName: "Verbal Ability",
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
      console.log("[VerbalAbilityPlugin] Initializing...");
      
      // Register Verbal Repositories
      DependencyContainer.register("IVerbalLessonRepository", new SupabaseVerbalLessonRepository());
      DependencyContainer.register("IVerbalQuestionRepository", new SupabaseVerbalQuestionRepository());
      DependencyContainer.register("IVerbalMockRepository", new SupabaseVerbalMockRepository());
      DependencyContainer.register("IVerbalMasteryRepository", new SupabaseVerbalMasteryRepository());
      DependencyContainer.register("IVerbalCompanyRepository", new SupabaseVerbalCompanyRepository());

      this.state = PluginState.READY;
      console.log("[VerbalAbilityPlugin] Ready.");
    } catch (e) {
      this.state = PluginState.FAILED;
      console.error("[VerbalAbilityPlugin] Failed to initialize", e);
    }
  }

  public getState(): PluginState {
    return this.state;
  }

  public async shutdown(): Promise<void> {
    console.log("[VerbalAbilityPlugin] Shutting down...");
    this.state = PluginState.DISABLED;
  }
}

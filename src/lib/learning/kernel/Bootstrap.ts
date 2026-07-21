import { DependencyContainer } from "../framework/DependencyContainer";
import { ServiceLocator } from "./ServiceLocator";
import { EventBus } from "../events/EventBus";
import { PluginState } from "./PluginState";
import { 
  SupabaseLessonRepository, 
  SupabaseQuestionRepository, 
  SupabaseMockRepository, 
  SupabaseMasteryRepository, 
  SupabaseCompanyRepository,
  SupabaseProgressRepository
} from "../repositories/SupabaseRepositories";
import { PluginManager } from "../../plugins/PluginManager";
import { LogicalReasoningPlugin } from "../../plugins/reasoning/LogicalReasoningPlugin";

export class Bootstrap {
  private static isInitialized = false;

  public static boot(): void {
    if (this.isInitialized && DependencyContainer.has("ILessonRepository")) {
      if (!DependencyContainer.has("IReasoningMasteryRepository")) {
        console.log("[Kernel] Core booted but plugins missing. Initializing plugins...");
        PluginManager.registerPlugin(new LogicalReasoningPlugin());
        PluginManager.initializeAll();
      }
      return;
    }

    console.log("[Kernel] Initializing NextHire AI Learning Platform...");
    
    // Register Core Repositories
    DependencyContainer.register("ILessonRepository", new SupabaseLessonRepository());
    DependencyContainer.register("IQuestionRepository", new SupabaseQuestionRepository());
    DependencyContainer.register("IMockRepository", new SupabaseMockRepository());
    DependencyContainer.register("IMasteryRepository", new SupabaseMasteryRepository());
    DependencyContainer.register("ICompanyRepository", new SupabaseCompanyRepository());
    DependencyContainer.register("IProgressRepository", new SupabaseProgressRepository());

    // Register and initialize subject plugins
    PluginManager.registerPlugin(new LogicalReasoningPlugin());
    PluginManager.initializeAll();

    this.isInitialized = true;
    console.log("[Kernel] Learning system boot completed successfully.");
  }

  public static shutdown(): void {
    console.log("[Kernel] Shutting down NextHire AI Learning Platform...");
    DependencyContainer.clear();
    EventBus.clear();
    this.isInitialized = false;
  }
}

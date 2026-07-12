import { DependencyContainer } from "../framework/DependencyContainer";
import { ServiceLocator } from "./ServiceLocator";
import { EventBus } from "../events/EventBus";
import { PluginState } from "./PluginState";
import { 
  SupabaseLessonRepository, 
  SupabaseQuestionRepository, 
  SupabaseMockRepository, 
  SupabaseMasteryRepository, 
  SupabaseCompanyRepository 
} from "../repositories/SupabaseRepositories";

export class Bootstrap {
  private static isInitialized = false;

  public static boot(): void {
    if (this.isInitialized && DependencyContainer.has("ILessonRepository")) return;

    console.log("[Kernel] Initializing NextHire AI Learning Platform...");
    
    // Register Core Repositories
    DependencyContainer.register("ILessonRepository", new SupabaseLessonRepository());
    DependencyContainer.register("IQuestionRepository", new SupabaseQuestionRepository());
    DependencyContainer.register("IMockRepository", new SupabaseMockRepository());
    DependencyContainer.register("IMasteryRepository", new SupabaseMasteryRepository());
    DependencyContainer.register("ICompanyRepository", new SupabaseCompanyRepository());

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

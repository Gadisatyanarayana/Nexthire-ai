import { DependencyContainer } from "../framework/DependencyContainer";
import { 
  SupabaseLessonRepository, 
  SupabaseQuestionRepository, 
  SupabaseMockRepository, 
  SupabaseMasteryRepository, 
  SupabaseCompanyRepository,
  SupabaseProgressRepository
} from "../repositories/SupabaseRepositories";
import { 
  SupabaseReasoningLessonRepository, 
  SupabaseReasoningQuestionRepository, 
  SupabaseReasoningMockRepository, 
  SupabaseReasoningMasteryRepository, 
  SupabaseReasoningCompanyRepository 
} from "../../plugins/reasoning/SupabaseReasoningRepositories";
import { 
  SupabaseVerbalLessonRepository, 
  SupabaseVerbalQuestionRepository, 
  SupabaseVerbalMockRepository, 
  SupabaseVerbalMasteryRepository, 
  SupabaseVerbalCompanyRepository 
} from "../../plugins/verbal/SupabaseVerbalRepositories";

export class Bootstrap {
  private static isInitialized = false;

  public static boot(): void {
    // If already initialized and all critical interfaces exist, return immediately
    if (
      this.isInitialized &&
      DependencyContainer.has("ILessonRepository") &&
      DependencyContainer.has("IReasoningMasteryRepository") &&
      DependencyContainer.has("IVerbalMasteryRepository")
    ) {
      return;
    }

    // Unconditionally and synchronously register all repositories for Core, Reasoning, and Verbal
    DependencyContainer.register("ILessonRepository", new SupabaseLessonRepository());
    DependencyContainer.register("IQuestionRepository", new SupabaseQuestionRepository());
    DependencyContainer.register("IMockRepository", new SupabaseMockRepository());
    DependencyContainer.register("IMasteryRepository", new SupabaseMasteryRepository());
    DependencyContainer.register("ICompanyRepository", new SupabaseCompanyRepository());
    DependencyContainer.register("IProgressRepository", new SupabaseProgressRepository());

    // Reasoning repositories
    DependencyContainer.register("IReasoningLessonRepository", new SupabaseReasoningLessonRepository());
    DependencyContainer.register("IReasoningQuestionRepository", new SupabaseReasoningQuestionRepository());
    DependencyContainer.register("IReasoningMockRepository", new SupabaseReasoningMockRepository());
    DependencyContainer.register("IReasoningMasteryRepository", new SupabaseReasoningMasteryRepository());
    DependencyContainer.register("IReasoningCompanyRepository", new SupabaseReasoningCompanyRepository());

    // Verbal repositories
    DependencyContainer.register("IVerbalLessonRepository", new SupabaseVerbalLessonRepository());
    DependencyContainer.register("IVerbalQuestionRepository", new SupabaseVerbalQuestionRepository());
    DependencyContainer.register("IVerbalMockRepository", new SupabaseVerbalMockRepository());
    DependencyContainer.register("IVerbalMasteryRepository", new SupabaseVerbalMasteryRepository());
    DependencyContainer.register("IVerbalCompanyRepository", new SupabaseVerbalCompanyRepository());

    this.isInitialized = true;
  }

  public static shutdown(): void {
    DependencyContainer.clear();
    this.isInitialized = false;
  }
}

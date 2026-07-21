import { DependencyContainer } from "../framework/DependencyContainer";
import { Bootstrap } from "../kernel/Bootstrap";
import { 
  ILessonRepository, 
  IQuestionRepository, 
  IMockRepository, 
  IMasteryRepository, 
  ICompanyRepository,
  IProgressRepository 
} from "./Interfaces";

export class RepositoryFactory {
  public static getLessonRepository(subject: string = "aptitude"): ILessonRepository {
    Bootstrap.boot();
    return subject === "reasoning" 
      ? DependencyContainer.resolve<ILessonRepository>("IReasoningLessonRepository")
      : DependencyContainer.resolve<ILessonRepository>("ILessonRepository");
  }

  public static getQuestionRepository(subject: string = "aptitude"): IQuestionRepository {
    Bootstrap.boot();
    return subject === "reasoning"
      ? DependencyContainer.resolve<IQuestionRepository>("IReasoningQuestionRepository")
      : DependencyContainer.resolve<IQuestionRepository>("IQuestionRepository");
  }

  public static getMockRepository(subject: string = "aptitude"): IMockRepository {
    Bootstrap.boot();
    return subject === "reasoning"
      ? DependencyContainer.resolve<IMockRepository>("IReasoningMockRepository")
      : DependencyContainer.resolve<IMockRepository>("IMockRepository");
  }

  public static getMasteryRepository(subject: string = "aptitude"): IMasteryRepository {
    Bootstrap.boot();
    return subject === "reasoning"
      ? DependencyContainer.resolve<IMasteryRepository>("IReasoningMasteryRepository")
      : DependencyContainer.resolve<IMasteryRepository>("IMasteryRepository");
  }

  public static getCompanyRepository(subject: string = "aptitude"): ICompanyRepository {
    Bootstrap.boot();
    return subject === "reasoning"
      ? DependencyContainer.resolve<ICompanyRepository>("IReasoningCompanyRepository")
      : DependencyContainer.resolve<ICompanyRepository>("ICompanyRepository");
  }

  public static getProgressRepository(): IProgressRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<IProgressRepository>("IProgressRepository");
  }
}


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
  public static normalizeSubject(subject: string = "aptitude"): "aptitude" | "reasoning" | "verbal" {
    const s = String(subject || "").toLowerCase().trim();
    if (
      s === "reasoning" ||
      s === "logical-reasoning" ||
      s === "logical_reasoning" ||
      s === "lr"
    ) {
      return "reasoning";
    }
    if (
      s === "verbal" ||
      s === "verbal-ability" ||
      s === "verbal_ability" ||
      s === "va"
    ) {
      return "verbal";
    }
    return "aptitude";
  }

  public static getLessonRepository(subject: string = "aptitude"): ILessonRepository {
    Bootstrap.boot();
    const normalized = this.normalizeSubject(subject);
    if (normalized === "reasoning") {
      return DependencyContainer.resolve<ILessonRepository>("IReasoningLessonRepository");
    }
    if (normalized === "verbal") {
      return DependencyContainer.resolve<ILessonRepository>("IVerbalLessonRepository");
    }
    return DependencyContainer.resolve<ILessonRepository>("ILessonRepository");
  }

  public static getQuestionRepository(subject: string = "aptitude"): IQuestionRepository {
    Bootstrap.boot();
    const normalized = this.normalizeSubject(subject);
    if (normalized === "reasoning") {
      return DependencyContainer.resolve<IQuestionRepository>("IReasoningQuestionRepository");
    }
    if (normalized === "verbal") {
      return DependencyContainer.resolve<IQuestionRepository>("IVerbalQuestionRepository");
    }
    return DependencyContainer.resolve<IQuestionRepository>("IQuestionRepository");
  }

  public static getMockRepository(subject: string = "aptitude"): IMockRepository {
    Bootstrap.boot();
    const normalized = this.normalizeSubject(subject);
    if (normalized === "reasoning") {
      return DependencyContainer.resolve<IMockRepository>("IReasoningMockRepository");
    }
    if (normalized === "verbal") {
      return DependencyContainer.resolve<IMockRepository>("IVerbalMockRepository");
    }
    return DependencyContainer.resolve<IMockRepository>("IMockRepository");
  }

  public static getMasteryRepository(subject: string = "aptitude"): IMasteryRepository {
    Bootstrap.boot();
    const normalized = this.normalizeSubject(subject);
    if (normalized === "reasoning") {
      return DependencyContainer.resolve<IMasteryRepository>("IReasoningMasteryRepository");
    }
    if (normalized === "verbal") {
      return DependencyContainer.resolve<IMasteryRepository>("IVerbalMasteryRepository");
    }
    return DependencyContainer.resolve<IMasteryRepository>("IMasteryRepository");
  }

  public static getCompanyRepository(subject: string = "aptitude"): ICompanyRepository {
    Bootstrap.boot();
    const normalized = this.normalizeSubject(subject);
    if (normalized === "reasoning") {
      return DependencyContainer.resolve<ICompanyRepository>("IReasoningCompanyRepository");
    }
    if (normalized === "verbal") {
      return DependencyContainer.resolve<ICompanyRepository>("IVerbalCompanyRepository");
    }
    return DependencyContainer.resolve<ICompanyRepository>("ICompanyRepository");
  }

  public static getProgressRepository(): IProgressRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<IProgressRepository>("IProgressRepository");
  }
}


import { DependencyContainer } from "../framework/DependencyContainer";
import { Bootstrap } from "../kernel/Bootstrap";
import { 
  ILessonRepository, 
  IQuestionRepository, 
  IMockRepository, 
  IMasteryRepository, 
  ICompanyRepository 
} from "./Interfaces";

export class RepositoryFactory {
  public static getLessonRepository(): ILessonRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<ILessonRepository>("ILessonRepository");
  }

  public static getQuestionRepository(): IQuestionRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<IQuestionRepository>("IQuestionRepository");
  }

  public static getMockRepository(): IMockRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<IMockRepository>("IMockRepository");
  }

  public static getMasteryRepository(): IMasteryRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<IMasteryRepository>("IMasteryRepository");
  }

  public static getCompanyRepository(): ICompanyRepository {
    Bootstrap.boot();
    return DependencyContainer.resolve<ICompanyRepository>("ICompanyRepository");
  }
}

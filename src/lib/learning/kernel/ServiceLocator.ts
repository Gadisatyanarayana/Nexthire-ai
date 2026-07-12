import { DependencyContainer } from "../framework/DependencyContainer";

export class ServiceLocator {
  public static registerService<T>(name: string, service: T): void {
    DependencyContainer.register(name, service);
  }

  public static getService<T>(name: string): T {
    return DependencyContainer.resolve<T>(name);
  }
}

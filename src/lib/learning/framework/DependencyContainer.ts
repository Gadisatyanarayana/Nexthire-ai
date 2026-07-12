export class DependencyContainer {
  private static instances = new Map<string, any>();
  private static factories = new Map<string, () => any>();

  public static register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  public static registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  public static resolve<T>(key: string): T {
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.instances.set(key, instance);
      return instance as T;
    }

    throw new Error(`Dependency not registered: ${key}`);
  }

  public static clear(): void {
    this.instances.clear();
    this.factories.clear();
  }

  public static has(key: string): boolean {
    return this.instances.has(key) || this.factories.has(key);
  }
}

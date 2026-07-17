import { ToolRegistryEntry } from '../contracts/tool';

export abstract class ToolRuntime {
  constructor(protected readonly toolDefinition: ToolRegistryEntry) {}

  /**
   * The core execution flow of any tool.
   * Enforces Authorization -> Validation -> Execution -> Logging
   */
  public async execute(input: any, userId: string): Promise<any> {
    await this.authorize(userId);
    const validatedInput = this.validate(input);
    
    // In a real environment, we'd wrap this with a retry policy based on toolDefinition.retryPolicy
    // and a timeout based on toolDefinition.timeoutMs
    
    try {
      const result = await this.doExecute(validatedInput);
      this.logExecution(userId, true);
      return result;
    } catch (e) {
      this.logExecution(userId, false, e);
      throw e;
    }
  }

  protected abstract authorize(userId: string): Promise<void>;
  protected abstract validate(input: any): any;
  protected abstract doExecute(validatedInput: any): Promise<any>;

  private logExecution(userId: string, success: boolean, error?: any) {
    console.log(`[TOOL] ${this.toolDefinition.name} | User: ${userId} | Success: ${success}`);
  }
}

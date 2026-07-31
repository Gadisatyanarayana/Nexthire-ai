import { BaseLLMProvider } from "../llm/BaseLLMProvider";

export abstract class BaseEngine {
  protected llm: BaseLLMProvider;

  constructor(llm: BaseLLMProvider) {
    this.llm = llm;
  }

  /**
   * Executes the engine's primary generation or validation task.
   * Takes a generic payload and returns a structured output.
   */
  abstract execute(payload: any): Promise<any>;
}

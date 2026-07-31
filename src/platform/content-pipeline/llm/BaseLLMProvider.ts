export interface LLMConfig {
  provider: "openai" | "gemini" | "claude" | "local" | "mock";
  apiKey?: string;
  model: string;
  temperature?: number;
}

export abstract class BaseLLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generates a structured JSON response enforcing a strict schema.
   */
  abstract generateStructuredOutput<T>(prompt: string, schema: any): Promise<T>;

  /**
   * Generates a raw string response.
   */
  abstract generateText(prompt: string): Promise<string>;
}

import { BaseLLMProvider, LLMConfig } from "./BaseLLMProvider";

export class MockProvider extends BaseLLMProvider {
  constructor(config: LLMConfig) {
    super(config);
  }

  async generateStructuredOutput<T>(prompt: string, schema: any): Promise<T> {
    console.log(`[MockProvider] Simulating Structured Output Generation for prompt length: ${prompt.length}`);
    
    // Naive mock matching based on schema structure
    // This allows the pipeline to execute end-to-end without failing.
    const mockOutput: any = {};
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        if (schema.properties[key].type === "string") mockOutput[key] = "Mock String Response";
        if (schema.properties[key].type === "number") mockOutput[key] = 99.9;
        if (schema.properties[key].type === "boolean") mockOutput[key] = true;
        if (schema.properties[key].type === "array") mockOutput[key] = ["Mock Array Item 1", "Mock Array Item 2"];
      }
    }
    return mockOutput as T;
  }

  async generateText(prompt: string): Promise<string> {
    console.log(`[MockProvider] Simulating Text Generation for prompt length: ${prompt.length}`);
    return `// Mocked optimal solution code generated successfully.\\nfunction solve() { return true; }`;
  }
}

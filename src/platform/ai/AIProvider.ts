/**
 * Abstract AI Layer
 * Ensures the platform is model-agnostic. No direct calls to OpenAI/Gemini/Claude inside business logic.
 */

export interface AIPromptContext {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  provider: 'OpenAI' | 'Gemini' | 'Claude' | 'Local';
  latencyMs: number;
}

export interface IAIProvider {
  generateCompletion(context: AIPromptContext): Promise<AIResponse>;
  generateJSON<T>(context: AIPromptContext, schema: any): Promise<T>;
  streamCompletion(context: AIPromptContext, onChunk: (chunk: string) => void): Promise<void>;
}

// Factory to resolve provider based on tenant settings or feature flags
export class AIProviderFactory {
  static getProvider(tenantId: string): IAIProvider {
    // Logic to return OpenAiProvider, GeminiProvider, etc.
    throw new Error('Not implemented');
  }
}

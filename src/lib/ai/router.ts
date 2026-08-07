import { AIProvider, AIProviderResponse } from "./types";
import { GoogleProvider } from "./providers/google";

export class AIRouter {
  static getProvider(capability: 'parsing' | 'rewriting' | 'scoring' | 'matching'): AIProvider {
    // In the future, we can route specific capabilities to specific providers
    // e.g., 'rewriting' -> Groq, 'scoring' -> OpenAI
    return GoogleProvider;
  }

  static async generateJSON(capability: 'parsing' | 'rewriting' | 'scoring' | 'matching', prompt: string, modelType?: 'fast' | 'reasoning'): Promise<AIProviderResponse> {
    const provider = this.getProvider(capability);
    return provider.generateJSON(prompt, modelType);
  }

  static async generateText(capability: 'parsing' | 'rewriting' | 'scoring' | 'matching', prompt: string, modelType?: 'fast' | 'reasoning'): Promise<AIProviderResponse> {
    const provider = this.getProvider(capability);
    return provider.generateText(prompt, modelType);
  }
}

export interface AIProvider {
  id: string;
  generateResponse(prompt: string): Promise<string>;
  readonly capabilities: { chat: boolean; vision: boolean; embeddings: boolean; moderation: boolean };
}

export class ProviderGateway {
  constructor(private providers: Map<string, AIProvider>) {}

  /**
   * Routes the prompt to the correct provider based on capability matrix, enforcing fallbacks.
   */
  public async executeWithFallback(prompt: string, requiredCapabilities: string[] = ['chat']): Promise<string> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => requiredCapabilities.every(cap => (p.capabilities as any)[cap] === true));

    if (availableProviders.length === 0) {
      throw new Error('No compatible providers found for requested capabilities');
    }

    // Try primary, then fallback
    let lastError = null;
    for (const provider of availableProviders) {
      try {
        return await provider.generateResponse(prompt);
      } catch (err) {
        lastError = err;
        console.warn(`[GATEWAY] Provider ${provider.id} failed, falling back...`);
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError}`);
  }
}

export interface AIProviderResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    model: string;
    latencyMs: number;
    tokens?: number;
  };
}

export interface AIProvider {
  name: string;
  generateJSON: (prompt: string, modelType?: 'fast' | 'reasoning') => Promise<AIProviderResponse>;
  generateText: (prompt: string, modelType?: 'fast' | 'reasoning') => Promise<AIProviderResponse>;
}

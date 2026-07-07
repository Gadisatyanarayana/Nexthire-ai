import { z } from 'zod';
import pino from 'pino'; // Assuming pino is available from package.json

const logger = pino({ name: 'SafeLLMClient' });

export type AIProvider = 'groq' | 'openrouter';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider?: AIProvider;
  model?: string; // e.g. "llama3-70b-8192" or "anthropic/claude-3.5-sonnet"
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_GROQ_MODEL = 'llama3-70b-8192';
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * SafeLLMClient: Hybrid AI Router for System Design Mentor
 * Features:
 * - Exponential backoff retries
 * - Timeout handling
 * - Hybrid routing (Groq for chat, OpenRouter for heavy review)
 * - Structured JSON validation via Zod
 */
export class SafeLLMClient {
  
  private static responseCache = new Map<string, { data: any, timestamp: number }>();
  private static CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getHeaders(provider: AIProvider): HeadersInit {
    if (provider === 'groq') {
      return {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      };
    } else {
      return {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'NextHire AI',
        'Content-Type': 'application/json'
      };
    }
  }

  private static getEndpoint(provider: AIProvider): string {
    return provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.io/api/v1/chat/completions';
  }

  /**
   * Raw completion with retry and timeout logic
   */
  public static async createCompletion(messages: LLMMessage[], config: LLMConfig = {}): Promise<Response> {
    const provider = config.provider || 'groq';
    const model = config.model || (provider === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OPENROUTER_MODEL);
    const maxRetries = config.retries ?? 3;
    const timeoutMs = config.timeoutMs ?? 15000;
    
    // We intentionally don't cache Streams here to avoid breaking SSE formatting, 
    // but we can cache structured JSON calls in generateStructuredJSON.

    let attempt = 0;
    
    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(this.getEndpoint(provider), {
          method: 'POST',
          headers: this.getHeaders(provider),
          body: JSON.stringify({
            model,
            messages,
            temperature: config.temperature ?? 0.7,
            max_tokens: config.maxTokens ?? 2000,
            stream: config.stream ?? false,
            response_format: config.stream ? undefined : { type: "json_object" } // Assume we generally want structured data if not streaming
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`HTTP ${response.status}: ${errBody}`);
        }

        return response; // Return raw response (could be a stream or json)
      } catch (error: any) {
        clearTimeout(timeoutId);
        logger.warn(`LLM attempt ${attempt + 1} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          logger.error("LLM maximum retries exceeded.");
          throw error;
        }

        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s...
        await this.delay(delayMs);
        attempt++;
      }
    }
    throw new Error("Unreachable");
  }

  /**
   * Strongly typed JSON generator
   */
  public static async generateStructuredJSON<T>(
    messages: LLMMessage[], 
    schema: z.ZodSchema<T>, 
    config: LLMConfig = {}
  ): Promise<T> {
    const cacheKey = JSON.stringify({ messages, model: config.model, provider: config.provider });
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      logger.info('LLM Cache hit');
      return cached.data as T;
    }

    // Force JSON mode on config
    const safeConfig = { ...config, stream: false };
    
    // Explicitly prompt the model to return JSON matching the schema
    const formatPrompt: LLMMessage = {
      role: 'system',
      content: `Respond EXCLUSIVELY in valid JSON format. Ensure your response perfectly matches this structure/schema constraints. No markdown wrapping or explanation text outside the JSON object.`
    };

    const finalMessages = [formatPrompt, ...messages];
    const response = await this.createCompletion(finalMessages, safeConfig);
    const data = await response.json();
    
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      const validatedData = schema.parse(parsed); // Zod validation
      
      this.responseCache.set(cacheKey, { data: validatedData, timestamp: Date.now() });
      return validatedData;
    } catch (e: any) {
      logger.error(`Failed to parse structured JSON from LLM: ${content}`);
      throw new Error(`LLM output did not match required schema: ${e.message}`);
    }
  }
}

import { AILogger } from '../observability/AILogger';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AICapability = 
  | 'RESUME_PARSE'
  | 'FAST_REWRITE'
  | 'VOICE_REASONING'
  | 'ATS_REVIEW'
  | 'JD_MATCH'
  | 'CAREER_COACH';

export interface AIProviderResponse {
  result: any;
  provider: string;
  model: string;
  estimatedPromptTokens?: number;
  estimatedCompletionTokens?: number;
}

export class AIProviderRouter {
  private static getGeminiClient() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not defined');
    return new GoogleGenerativeAI(apiKey);
  }

  static async execute(
    capability: AICapability, 
    prompt: string, 
    context: any = {}
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    
    // Abstracting provider selection with Capability Resolver
    const providerMap: Record<AICapability, { provider: string, model: string, fallbackProvider: string, fallbackModel: string, retries: number }> = {
      'RESUME_PARSE': { provider: 'google', model: 'gemini-1.5-pro', fallbackProvider: 'openai', fallbackModel: 'gpt-4o', retries: 2 },
      'ATS_REVIEW': { provider: 'google', model: 'gemini-1.5-pro', fallbackProvider: 'openai', fallbackModel: 'gpt-4o', retries: 2 },
      'JD_MATCH': { provider: 'google', model: 'gemini-1.5-flash', fallbackProvider: 'openai', fallbackModel: 'gpt-4o-mini', retries: 3 },
      'FAST_REWRITE': { provider: 'groq', model: 'llama3-70b-8192', fallbackProvider: 'google', fallbackModel: 'gemini-1.5-flash', retries: 2 },
      'VOICE_REASONING': { provider: 'openai', model: 'gpt-4o', fallbackProvider: 'google', fallbackModel: 'gemini-1.5-pro', retries: 1 },
      'CAREER_COACH': { provider: 'google', model: 'gemini-1.5-flash', fallbackProvider: 'openai', fallbackModel: 'gpt-4o-mini', retries: 2 },
    };

    const config = providerMap[capability];

    AILogger.info(`Routing capability ${capability} to ${config.provider}`, {
      requestId: context.requestId || 'router',
      provider: config.provider,
      model: config.model
    });

    try {
      let resultText = '';
      
      if (config.provider === 'google') {
        resultText = await this.executeGoogleGemini(config.model, prompt, context);
      } else {
        throw new Error(`Provider ${config.provider} not yet implemented.`);
      }

      // We expect the LLM to return JSON due to prompts
      let parsedData = {};
      try {
        const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanedText);
      } catch (e) {
        AILogger.error('Failed to parse LLM output as JSON', e, { 
          requestId: context.requestId || 'router', 
          provider: config.provider, 
          model: config.model 
        });
        throw new Error('LLM did not return valid JSON');
      }
      
      const durationMs = Date.now() - startTime;
      
      AILogger.trackPerformance(
        {
          requestId: context.requestId || 'router',
          provider: config.provider,
          model: config.model,
          processingStage: capability
        },
        {
          durationMs,
          estimatedPromptTokens: 150,
          estimatedCompletionTokens: 300,
          cacheHit: false,
          retryCount: 0
        }
      );

      return {
        result: parsedData,
        provider: config.provider,
        model: config.model,
        estimatedPromptTokens: 150,
        estimatedCompletionTokens: 300
      };
    } catch (error) {
       AILogger.error(`Provider execution failed for ${capability}`, error, {
        requestId: context.requestId || 'router',
        provider: config.provider,
        model: config.model
      });
      throw error;
    }
  }

  private static async executeGoogleGemini(modelName: string, prompt: string, context: any): Promise<string> {
    const genAI = this.getGeminiClient();
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const fullPrompt = `${context.systemInstruction ? `SYSTEM: ${context.systemInstruction}\n\n` : ''}USER:\n${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }
}

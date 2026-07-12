import { SafeLLMClient, LLMMessage } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";
import { AIPromptManager } from "./AIPromptManager";

export class AITutorEngine {
  public static buildChatPrompt(
    userMessage: string,
    history: LLMMessage[] = [],
    context: any = {},
    personalization: any = {}
  ): LLMMessage[] {
    const systemPrompt = AIPromptManager.getTutorPrompt(context, personalization);

    return [
      systemPrompt,
      ...history,
      { role: 'user', content: userMessage }
    ];
  }

  public static async explainFormula(formulaName: string, context: any = {}): Promise<any> {
    const schema = z.object({
      explanation: z.string(),
      derivation: z.string().optional(),
      memoryTrick: z.string().optional(),
      alternativeMethod: z.string().optional(),
      commonMistakes: z.array(z.string()).optional(),
      interviewTrick: z.string().optional()
    });

    const messages = AIPromptManager.getFormulaExplainerPrompt(formulaName, context);
    return await SafeLLMClient.generateStructuredJSON(messages, schema);
  }
}

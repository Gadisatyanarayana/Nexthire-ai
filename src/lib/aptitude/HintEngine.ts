import { SafeLLMClient } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";
import { AIPromptManager } from "./AIPromptManager";

export class HintEngine {
  public static async generateHints(question: string, options: string[], correctOption: string, topic: string): Promise<any> {
    const schema = z.object({
      level1: z.string(),
      level2: z.string(),
      level3: z.string(),
      level4: z.string(),
      level5: z.string()
    });

    const messages = AIPromptManager.getHintPrompt(question, options, correctOption, topic);
    return await SafeLLMClient.generateStructuredJSON(messages, schema);
  }
}

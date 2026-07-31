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

  public static generateNaturalFallbackResponse(userMessage: string, systemPromptText: string = ""): string {
    const msg = userMessage.trim().toLowerCase();

    // 1. Simple Greetings
    if (/^(hello|hi|hey|heyy|greetings|good morning|good afternoon|good evening|hola|wassup)\b/i.test(msg) || msg === "hello" || msg === "hi" || msg === "hey") {
      return "Hey there! I'm your AI Tutor. Whether you're stuck on a tricky question, looking for a 30-second shortcut, or want to understand the intuition behind a formula, I'm here to help. What topic or problem are you working on today?";
    }

    // 2. Module & Lesson references (e.g. "module 2 in that lesson 1")
    if (msg.includes("module") || msg.includes("lesson")) {
      const modMatch = msg.match(/module\s*(\d+)/i);
      const lesMatch = msg.match(/lesson\s*(\d+)/i);
      const modNum = modMatch ? modMatch[1] : "this";
      const lesNum = lesMatch ? lesMatch[1] : "topic";

      return `Got it! In Module ${modNum}, Lesson ${lesNum}, the most effective approach is locking in your core assumptions first before diving into calculations. If you're working on a specific question in this lesson, share the problem statement or numbers with me and we'll break down the intuition together!`;
    }

    // 3. Topic-Specific Conversational Answers
    if (msg.includes("percentage") || msg.includes("percent") || msg.includes("%")) {
      return "Percentages are just ratios out of 100. A great mental math trick is remembering key fractional equivalents: 1/6 is 16.67%, 1/7 is 14.28%, and 1/8 is 12.5%. If you're calculating percentage increase or decrease, use `(change / original) * 100`. Are you solving a percentage change problem or a successive discount question?";
    }

    if (msg.includes("blood relation") || msg.includes("family tree")) {
      return "For Blood Relations, always draw a family tree using simple symbols: square for male, circle for female, single line for siblings, double line for married couples, and vertical line for generations. Break long statements backwards starting from 'my father's son...'. Which relation in your problem feels confusing?";
    }

    if (msg.includes("average") || msg.includes("mean")) {
      return "Instead of adding large numbers and dividing, try the assumed mean technique: pick a round baseline number near your dataset, find the small deviations (+3, -5, +2), average those deviations, and add it back to your baseline. It saves over 30 seconds per problem! What numbers are you averaging?";
    }

    if (msg.includes("seating") || msg.includes("arrangement")) {
      return "With seating arrangements, always place fixed definite clues first—like 'A sits 3rd to the left of B'—on your diagram. Never make assumptions about flexible clues until your main anchors are locked in. Are you working on a circular arrangement or a linear row?";
    }

    if (msg.includes("grammar") || msg.includes("subject") || msg.includes("verb") || msg.includes("error")) {
      return "The most common grammar trap in placement tests is subject-verb agreement with prepositional phrases. For example, in 'The collection of rare books WAS sold', the subject is 'collection' (singular), not 'books'. Drop the prepositional phrase to verify the verb quickly!";
    }

    if (msg.includes("rc") || msg.includes("reading") || msg.includes("passage")) {
      return "For Reading Comprehension passages, read the question stems first before reading the passage. This converts passive reading into an active search for key concepts, saving you precious time in timed tests!";
    }

    if (msg.includes("why") || msg.includes("how")) {
      return "That's a key question! The intuition comes down to how variables scale. Instead of memorizing the formula, visualize what happens when one variable doubles—if the output quadruples, you know it's a quadratic relationship. Tell me the specific scenario you're looking at and we'll visualize it together!";
    }

    // 4. Adaptive Varied Dynamic Response
    const conversationalResponses = [
      `I hear you! When tackling this type of problem, identifying the core constraint first is key. If you drop the specific numbers or question here, I'll walk you through the fastest shortcut step-by-step!`,
      `Great focus! In competitive placement tests, eliminating two obviously wrong choices first gives you a 50% chance right away. What specific part of this question would you like to explore?`,
      `Spot on. Let's look at the underlying intuition: once you map out the given values, the pattern reveals itself. Share the problem statement you're looking at and we'll tackle it together!`
    ];

    const hash = msg.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return conversationalResponses[hash % conversationalResponses.length];
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

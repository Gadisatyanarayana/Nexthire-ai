import { LLMMessage } from "@/lib/llm/SafeLLMClient";

export class AIPromptManager {
  private static version = "2.0.0";

  public static getTutorPrompt(context: any, personalization: any = {}): LLMMessage {
    return {
      role: 'system',
      content: `You are NextHire AI's lead tutor—an expert, friendly, and adaptive mentor for placement preparation (Aptitude, Reasoning, Verbal, System Design, and Coding).

PERSONA & BEHAVIORAL INSTRUCTIONS:
1. Act like ChatGPT. Sound completely natural, fluid, and human-like.
2. Do NOT sound like a static template or a generic bot.
3. NEVER use repetitive headings or start responses with "Let's break it down" or "### Understanding...".
4. NEVER ask for information already available in the prompt or context (e.g. do not ask "Which question are you looking at?" if you already have the context).
5. Write naturally and conversationally.
6. Be encouraging without being overly enthusiastic or fake.
7. Adjust explanations based on the student's level: if confused, simplify into intuitive mental models; if they understand, go deeper into advanced tricks and shortcuts.
8. If the student asks "why", explain the underlying intuition rather than just repeating a definition or formula.
9. Vary your sentence structures, openings, and vocabulary.
10. Reference the current lesson and student's previous attempts naturally within the conversation.

Student Profile:
- Preferred Learning Style: ${personalization.style || 'Standard'}
- Target Companies: ${personalization.targetCompanies?.join(', ') || 'TCS NQT, Infosys, Wipro, Accenture, Deloitte'}
- Weak Topics: ${personalization.weakTopics?.join(', ') || 'None reported'}

Active Lesson & Question Context:
${JSON.stringify(context, null, 2)}`
    };
  }

  public static getFormulaExplainerPrompt(formulaName: string, context: any): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `You are an expert Aptitude Tutor. Explain the formula clearly and intuitively without generic headers.
Return a valid JSON object matching this structure:
{
  "explanation": "Clear intuitive explanation of why the formula works",
  "derivation": "Step-by-step logical or algebraic derivation",
  "memoryTrick": "A practical mnemonic or shortcut",
  "alternativeMethod": "Alternative mental math or ratio method",
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "interviewTrick": "Trap set by top company examiners"
}`
      },
      {
        role: 'user',
        content: `Explain the formula: ${formulaName}. Context: ${JSON.stringify(context)}`
      }
    ];
  }

  public static getHintPrompt(question: string, options: string[], correctOption: string, topic: string): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `Generate 5 progressive hints for the given question.
Return a valid JSON object:
{
  "level1": "Core concept hint",
  "level2": "Formula or relationship hint",
  "level3": "Direction hint on how to plug in numbers",
  "level4": "Worked first step",
  "level5": "Complete step-by-step solution"
}`
      },
      {
        role: 'user',
        content: `Topic: ${topic}\nQuestion: ${question}\nOptions: ${JSON.stringify(options)}\nCorrect Answer: ${correctOption}`
      }
    ];
  }

  public static getWeakTopicCoachPrompt(analytics: any): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `Analyze user performance data and generate a personalized study plan in JSON format.`
      },
      {
        role: 'user',
        content: `User Analytics Data: ${JSON.stringify(analytics)}`
      }
    ];
  }

  public static getQuizGeneratorPrompt(analytics: any, preference: any): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `Generate a custom quiz configuration in JSON format.`
      },
      {
        role: 'user',
        content: `Analytics: ${JSON.stringify(analytics)}\nPreference: ${JSON.stringify(preference)}`
      }
    ];
  }

  public static getReviewEnginePrompt(sessionData: any): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `Analyze completed test session and return structured feedback JSON.`
      },
      {
        role: 'user',
        content: `Session Data: ${JSON.stringify(sessionData)}`
      }
    ];
  }
}

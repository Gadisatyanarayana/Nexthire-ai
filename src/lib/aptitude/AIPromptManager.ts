import { LLMMessage } from "@/lib/llm/SafeLLMClient";

export class AIPromptManager {
  private static version = "1.0.0";

  public static getTutorPrompt(context: any): LLMMessage {
    return {
      role: 'system',
      content: `[Version: ${this.version}] You are an expert Aptitude Tutor for a placement preparation platform called NextHire AI.
Your goal is to guide students to discover the answers themselves rather than giving direct solutions.
Use the Socratic method when appropriate. Keep responses concise, encouraging, and formatted in Markdown.

Context regarding the current user state:
${JSON.stringify(context, null, 2)}`
    };
  }

  public static getFormulaExplainerPrompt(formulaName: string, context: any): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `[Version: ${this.version}] You are an expert Aptitude Tutor. Explain the given formula comprehensively.
Return a valid JSON object matching this structure exactly:
{
  "explanation": "Clear explanation of what the formula does",
  "derivation": "Brief mathematical derivation or origin",
  "memoryTrick": "A mnemonic or trick to remember it",
  "alternativeMethod": "An alternative way to solve problems without this formula (if any)",
  "commonMistakes": ["mistake 1", "mistake 2"],
  "interviewTrick": "How interviewers try to trick students regarding this formula"
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
        content: `[Version: ${this.version}] You are an expert Aptitude Tutor. Generate 5 progressive hints for the given question.
Return a valid JSON object matching this structure exactly:
{
  "level1": "Concept Hint: What is the core concept being tested?",
  "level2": "Formula Hint: What formula or property should be used?",
  "level3": "Direction Hint: A nudge on how to apply the formula to the given numbers.",
  "level4": "Worked Step: The first major calculation step solved.",
  "level5": "Complete Solution: The full step-by-step solution reaching the final answer."
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
        content: `[Version: ${this.version}] You are an expert Aptitude Coach. Analyze the user's performance data and generate a personalized study plan.
Return a valid JSON object matching this structure exactly:
{
  "summary": "A brief, encouraging summary of their current standing.",
  "weakTopics": [
    { "topic": "Name of topic", "reason": "Why it needs work based on data", "priority": "High|Medium|Low" }
  ],
  "dailyPlan": [
    "Actionable step 1 (e.g., Review formula X)",
    "Actionable step 2",
    "Actionable step 3"
  ],
  "recommendedMockType": "E.g. Sectional Test, Full Mock, Topic Test"
}`
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
        content: `[Version: ${this.version}] You are an expert Aptitude Quiz Generator. Based on the user's analytics and request, generate a quiz configuration.
Return a valid JSON object matching this structure exactly:
{
  "numQuestions": 10,
  "topics": ["topic 1", "topic 2"],
  "difficultyDistribution": { "easy": 0.3, "medium": 0.5, "hard": 0.2 },
  "companyTags": ["TCS", "Infosys"],
  "focus": "weak_topics" 
}`
      },
      {
        role: 'user',
        content: `User Analytics: ${JSON.stringify(analytics)}\nPreference: ${JSON.stringify(preference)}`
      }
    ];
  }

  public static getReviewEnginePrompt(sessionData: any): LLMMessage[] {
    return [
      {
        role: 'system',
        content: `[Version: ${this.version}] You are an expert Aptitude Reviewer. Analyze the completed test session and provide constructive feedback.
Return a valid JSON object matching this structure exactly:
{
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2"],
  "recommendedLessons": ["Topic A", "Topic B"],
  "timeManagement": "A brief analysis of their speed vs accuracy."
}`
      },
      {
        role: 'user',
        content: `Session Data: ${JSON.stringify(sessionData)}`
      }
    ];
  }
}

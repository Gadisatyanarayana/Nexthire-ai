import { NextRequest } from 'next/server';
import { SafeLLMClient, LLMMessage } from '@/lib/llm/SafeLLMClient';
import { getReviewerPrompt, PROMPT_VERSION } from '@/lib/prompts/systemDesignPrompts';
import { z } from 'zod';

export const runtime = 'edge';

// Strict Zod schema for the AI to return
const ReviewResponseSchema = z.object({
  scores: z.object({
    correctness: z.number().min(0).max(10),
    scalability: z.number().min(0).max(10),
    faultTolerance: z.number().min(0).max(10),
    costEfficiency: z.number().min(0).max(10),
  }),
  feedback: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    criticalFlaws: z.array(z.string()).optional(),
  }),
  overallSummary: z.string(),
  suggestedResources: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const { submissionPayload, lessonTitle } = await req.json();

    if (!submissionPayload) {
      return new Response(JSON.stringify({ error: 'Submission payload is required' }), { status: 400 });
    }

    const systemPrompt = getReviewerPrompt();

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n[PROMPT_VERSION: ${PROMPT_VERSION}]\nTopic: ${lessonTitle}`
      },
      {
        role: 'user',
        content: `Please review my architecture design submission:\n\n${JSON.stringify(submissionPayload, null, 2)}`
      }
    ];

    // Using OpenRouter for heavy architecture reviews
    const result = await SafeLLMClient.generateStructuredJSON(messages, ReviewResponseSchema, {
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet', // Advanced reasoning for HLD
      temperature: 0.2, // Low variance for strict reviews
      timeoutMs: 30000, // Longer timeout for deep analysis
      retries: 2
    });

    // In a real flow, we would save this to sd_ai_feedback table here using a service layer
    // await saveReviewFeedback(userId, lessonId, submissionPayload, result, PROMPT_VERSION, 'claude-3.5-sonnet');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Review API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

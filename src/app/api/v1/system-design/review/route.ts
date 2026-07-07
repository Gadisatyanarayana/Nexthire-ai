import { NextRequest } from 'next/server';
import { SafeLLMClient, LLMMessage } from '@/lib/llm/SafeLLMClient';
import { getReviewerPrompt, PROMPT_VERSION } from '@/lib/prompts/systemDesignPrompts';
import { supabaseAdmin } from '@/lib/api/systemDesignV2';
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
    const { userId, lessonId, submissionPayload, lessonTitle } = await req.json();

    if (!submissionPayload || !userId || !lessonId) {
      return new Response(JSON.stringify({ error: 'Missing required payload (submission, userId, lessonId)' }), { status: 400 });
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

    // Real flow, insert into sd_ai_feedback table using supabaseAdmin
    const { error: insertError } = await supabaseAdmin.from('sd_ai_feedback').insert({
      user_id: userId,
      lesson_id: lessonId,
      submission_payload: submissionPayload,
      ai_review: result,
      prompt_version: PROMPT_VERSION,
      model_name: 'anthropic/claude-3.5-sonnet',
      confidence: 0.95 // Claude is usually very confident with structured output
    });

    if (insertError) {
      console.warn("Failed to persist AI Review", insertError);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Review API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

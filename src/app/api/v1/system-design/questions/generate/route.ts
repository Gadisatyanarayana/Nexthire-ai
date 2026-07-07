import { NextRequest } from 'next/server';
import { SafeLLMClient, LLMMessage } from '@/lib/llm/SafeLLMClient';
import { getQuizGeneratorPrompt, PROMPT_VERSION } from '@/lib/prompts/systemDesignPrompts';
import { z } from 'zod';

export const runtime = 'edge';

const MCQSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctOptionIndex: z.number().min(0).max(3),
  explanation: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, studentMasteryScore } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), { status: 400 });
    }

    const systemPrompt = getQuizGeneratorPrompt({
      lessonTitle: topic,
      difficulty,
      studentMasteryScore
    });

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n[PROMPT_VERSION: ${PROMPT_VERSION}]`
      },
      {
        role: 'user',
        content: `Generate a distinct, challenging MCQ about ${topic}. Ensure it requires deep understanding.`
      }
    ];

    const result = await SafeLLMClient.generateStructuredJSON(messages, MCQSchema, {
      provider: 'groq',
      model: 'llama3-70b-8192',
      temperature: 0.7,
      retries: 2
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Question Generation API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

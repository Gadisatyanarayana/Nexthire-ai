import { NextResponse } from 'next/server';
import { SafeLLMClient } from '@/lib/llm/SafeLLMClient';
import { z } from 'zod';

export const runtime = 'edge';

const ReviewerSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  rubric_evaluation: z.object({
    scalability: z.object({ rating: z.string(), comments: z.string() }),
    security: z.object({ rating: z.string(), comments: z.string() }),
    maintainability: z.object({ rating: z.string(), comments: z.string() }),
    observability: z.object({ rating: z.string(), comments: z.string() }),
    consistency: z.object({ rating: z.string(), comments: z.string() }),
    caching: z.object({ rating: z.string(), comments: z.string() }),
    apis: z.object({ rating: z.string(), comments: z.string() }),
    databases: z.object({ rating: z.string(), comments: z.string() }),
    fault_tolerance: z.object({ rating: z.string(), comments: z.string() }),
  }),
  mistakes: z.array(z.string()),
  missing_components: z.array(z.string()),
  optimizations: z.array(z.string()),
  interviewer_feedback: z.string(),
});

export async function POST(req: Request) {
  try {
    const { architectureData, format } = await req.json();

    if (!architectureData) {
      return NextResponse.json({ error: 'Architecture data is required' }, { status: 400 });
    }

    const systemPrompt = `You are a strict Staff Engineer at a FAANG company interviewing a candidate.
Evaluate the provided architecture (${format || 'JSON/Diagram nodes'}).
Rate each rubric criteria accurately. 
Respond EXACTLY matching the JSON schema provided.`;

    const data = await SafeLLMClient.generateStructuredJSON(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(architectureData) }
      ],
      ReviewerSchema,
      { provider: 'openrouter', temperature: 0.2 } // Use openrouter for heavy reasoning if possible, or fallback
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Architecture Review Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

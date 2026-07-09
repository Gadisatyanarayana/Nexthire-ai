import { NextResponse } from 'next/server';
import { SafeLLMClient } from '@/lib/llm/SafeLLMClient';
import { z } from 'zod';

export const runtime = 'edge';

const GeneratorSchema = z.object({
  title: z.string(),
  requirements: z.array(z.string()),
  capacity_estimation: z.object({
    storage: z.string(),
    bandwidth: z.string(),
    requests_per_sec: z.string(),
  }),
  hld: z.string().describe("Mermaid JS flowchart code"),
  lld_details: z.array(z.string()),
  database_schema: z.string().describe("Markdown tables representing DB schema"),
  api_design: z.array(z.object({ endpoint: z.string(), method: z.string(), description: z.string() })),
  tradeoffs: z.array(z.string()),
  scaling: z.array(z.string()),
  cost_estimation: z.string().describe("Brief estimated cost breakdown"),
});

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert System Design Architect. 
Your task is to generate a comprehensive architecture design based on the user's prompt.
Mode: ${mode || 'standard'}
Respond EXACTLY matching the JSON schema provided, with NO MARKDOWN WRAPPERS outside the JSON.
Include Mermaid JS for HLD. Provide DB schemas as markdown tables inside the string.`;

    const data = await SafeLLMClient.generateStructuredJSON(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      GeneratorSchema,
      { provider: 'groq', temperature: 0.7 }
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Architecture Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

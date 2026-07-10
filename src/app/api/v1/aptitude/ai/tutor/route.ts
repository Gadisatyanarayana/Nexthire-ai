import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SafeLLMClient, LLMMessage } from "@/lib/llm/SafeLLMClient";
import { AITutorEngine } from "@/lib/aptitude/AITutorEngine";
import { z } from "zod";

const TutorRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })).optional(),
  context: z.any().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = TutorRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid payload", details: (result.error as any).errors }, { status: 400 });
    }

    const { message, history, context } = result.data;

    // Use AITutorEngine to build the prompt
    const messages = AITutorEngine.buildChatPrompt(message, history as LLMMessage[], context);

    // Stream the response using SafeLLMClient
    const response = await SafeLLMClient.createCompletion(messages, { stream: true, provider: 'groq' });
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "LLM Provider Error" }, { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

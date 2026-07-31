import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SafeLLMClient, LLMMessage } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";
import { LearningService } from "@/lib/learning/services/LearningService";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";
const { AITutorEngine } = LearningService;

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

    let personalization = {
      style: 'Standard',
      speed: 'Moderate',
      weakTopics: [] as string[],
      strongTopics: [] as string[],
      targetCompanies: [] as string[]
    };

    // Fast-path: If Groq API key is unconfigured or mock, bypass remote DB queries to achieve instant <50ms streaming response
    const hasGroqKey = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("mock") && process.env.GROQ_API_KEY.trim() !== "";

    if (hasGroqKey) {
      try {
        const supabase = LearningQueryService.getRawClient();
        
        // Fast 200ms timeout for optional personalization lookup
        const fetchPersonalization = async () => {
          const { data: analyticsData } = await supabase
            .from('reasoning_topic_mastery')
            .select('topic_id, mastery_score')
            .eq('user_id', session.user.id);
            
          if (analyticsData) {
            personalization.weakTopics = analyticsData.filter(d => d.mastery_score < 50).map(d => d.topic_id).slice(0, 3);
            personalization.strongTopics = analyticsData.filter(d => d.mastery_score >= 80).map(d => d.topic_id).slice(0, 3);
          }
        };

        await Promise.race([
          fetchPersonalization(),
          new Promise(r => setTimeout(r, 200))
        ]);
      } catch {
        // Safe fallback if DB is unreachable
      }
    }

    // Build Chat Prompt
    const messages = AITutorEngine.buildChatPrompt(message, history as LLMMessage[], context, personalization);

    // Stream completion cleanly using SafeLLMClient (handles fallback streams gracefully if key is missing)
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

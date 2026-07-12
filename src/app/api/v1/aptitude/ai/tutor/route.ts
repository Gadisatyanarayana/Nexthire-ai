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

    // Identifier Resolution & Personalization Fetch
    const supabase = LearningQueryService.getRawClient();

    let personalization = {
      style: 'Standard',
      speed: 'Moderate',
      weakTopics: [] as string[],
      strongTopics: [] as string[],
      targetCompanies: [] as string[]
    };

    try {
      // Fetch user mastery metrics to build memory/personalization on the fly
      const { data: analyticsData } = await supabase
        .from('apt_topic_mastery')
        .select('topic_id, mastery_score')
        .eq('user_id', session.user.id);
        
      if (analyticsData) {
        personalization.weakTopics = analyticsData.filter(d => d.mastery_score < 50).map(d => d.topic_id).slice(0, 3);
        personalization.strongTopics = analyticsData.filter(d => d.mastery_score >= 80).map(d => d.topic_id).slice(0, 3);
      }

      // Fetch user preferences (mocked via profiles table if it exists, skipping detailed schema check for safety)
      const { data: profile } = await supabase.from('profiles').select('learning_style, target_companies').eq('id', session.user.id).single();
      if (profile) {
        if (profile.learning_style) personalization.style = profile.learning_style;
        if (profile.target_companies) personalization.targetCompanies = profile.target_companies;
      }
      
      // Context Resolution for Active Question
      if (context && context.questionId) {
        const { data: qData } = await supabase.from('apt_questions').select('question, options, correct_index, explanation, difficulty').eq('id', context.questionId).single();
        if (qData) {
          context.activeQuestionData = {
            question: qData.question,
            options: qData.options,
            correctOption: qData.correct_index,
            explanation: qData.explanation,
            difficulty: qData.difficulty
          };
        }
      }
    } catch (e) {
      console.warn("Could not fetch full personalization context:", e);
    }

    // Use AITutorEngine to build the prompt
    const messages = AITutorEngine.buildChatPrompt(message, history as LLMMessage[], context, personalization);

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

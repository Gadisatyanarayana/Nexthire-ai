import { NextRequest } from 'next/server';
import { SafeLLMClient, LLMMessage } from '@/lib/llm/SafeLLMClient';
import { getTeacherPrompt, getInterviewerPrompt, PROMPT_VERSION } from '@/lib/prompts/systemDesignPrompts';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, lessonTitle, difficulty, masteryScore, weakTopics, mode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    const context = { lessonTitle, difficulty, studentMasteryScore: masteryScore, weakTopics };
    
    let systemPromptContent = '';
    if (mode === 'interview') {
      systemPromptContent = getInterviewerPrompt(context);
    } else {
      systemPromptContent = getTeacherPrompt(context);
    }

    const systemMessage: LLMMessage = {
      role: 'system',
      content: `${systemPromptContent}\n[PROMPT_VERSION: ${PROMPT_VERSION}]`
    };

    const finalMessages = [systemMessage, ...messages];

    // Using Groq for low-latency mentoring
    const response = await SafeLLMClient.createCompletion(finalMessages, {
      provider: 'groq',
      stream: true,
      maxTokens: 1024,
      timeoutMs: 10000
    });

    if (!response.body) {
      throw new Error("No response body returned from LLM client");
    }

    // Return the raw stream directly to the client
    // Note: The client will need to parse the SSE (Server-Sent Events) chunks
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Mentor API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

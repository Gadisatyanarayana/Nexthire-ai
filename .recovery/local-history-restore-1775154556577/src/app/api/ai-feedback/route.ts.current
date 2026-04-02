import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `ai-feedback:${ip}`, limit: 15, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const { code, language } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const aiResponse = await axios.post(
      'https://openrouter.io/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-2-7b-chat:free',
        messages: [
          {
            role: 'user',
            content: `You are a code reviewer. Analyze this ${language} code:

\`\`\`
${code}
\`\`\`

Provide analysis on:
1. Time complexity
2. Issues (if any)
3. Optimizations

Keep it concise and structured.`,
          },
        ],
        max_tokens: 500,
      },
      {
        timeout: 12000,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const feedback =
      aiResponse.data.choices[0]?.message?.content ||
      'Unable to generate feedback';

    return NextResponse.json({ feedback });
  } catch (error: unknown) {
    const message =
      axios.isAxiosError(error) && error.code === 'ECONNABORTED'
        ? 'AI feedback request timed out. Please try again.'
        : error instanceof Error
        ? error.message
        : 'Failed to generate feedback';
    console.error('AI feedback error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

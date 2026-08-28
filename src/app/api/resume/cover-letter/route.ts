import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/router';

export async function POST(req: Request) {
  try {
    const { document, jobDescription, style = 'Modern' } = await req.json();

    if (!document) {
      return NextResponse.json({ success: false, error: "Resume document is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const prompt = `
      You are an elite Career Coach and Executive Assistant.
      Write a compelling Cover Letter using the provided Resume Intelligence Profile.
      If a Job Description is provided, heavily tailor the letter to it.
      
      Style: ${style} (Options: Modern, Corporate, Academic, Startup, FAANG)
      
      Return a JSON object matching this schema EXACTLY:
      {
        "coverLetter": "The markdown formatted cover letter content..."
      }

      Job Description:
      ${jobDescription || 'N/A'}

      Resume Intelligence:
      ${JSON.stringify(document.intelligence)}
    `;

    const aiRes = await AIRouter.generateJSON('rewriting', prompt, 'reasoning');

    if (!aiRes.success || !aiRes.data) {
      return NextResponse.json({ success: false, error: aiRes.error, code: "AI_TIMEOUT", retryable: true }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiRes.data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/router';

export async function POST(req: Request) {
  try {
    const { text, type = 'bullet', targetCompany = "" } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (type === 'summary') {
      const prompt = `
        You are an expert Resume Writer.
        Take the following notes and rewrite them into a compelling 3-4 sentence professional summary.
        ${targetCompany ? `Optimize specifically for ${targetCompany}.` : ''}
        
        Raw text: "${text}"
        
        Return a JSON object EXACTLY in this format:
        { "text": "The improved summary..." }
      `;
      const aiRes = await AIRouter.generateJSON('rewriting', prompt, 'fast');
      return NextResponse.json(aiRes);
    }

    // Bullet Rewriting Pipeline
    const prompt = `
      You are an elite Resume Writer for enterprise placements.
      Take the following raw statement and rewrite it into 7 distinct, highly effective variations.
      ${targetCompany ? `Optimize specifically for ${targetCompany} company culture and technical expectations.` : ''}
      
      Return a JSON object EXACTLY in this format:
      {
        "variations": [
          { "type": "STAR", "text": "..." },
          { "type": "Recruiter", "text": "..." },
          { "type": "Executive", "text": "..." },
          { "type": "FAANG", "text": "..." },
          { "type": "ATS", "text": "..." },
          { "type": "Leadership", "text": "..." },
          { "type": "Impact", "text": "..." }
        ]
      }
      
      Raw text: "${text}"
    `;

    const aiRes = await AIRouter.generateJSON('rewriting', prompt, 'fast');

    if (!aiRes.success || !aiRes.data) {
      return NextResponse.json({ 
        success: false, 
        error: aiRes.error || "Failed to generate variations",
        code: "AI_TIMEOUT",
        retryable: true 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiRes.data });

  } catch (error: any) {
    console.error("Resume Improve Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to improve text", code: "INTERNAL_ERROR", retryable: false }, { status: 500 });
  }
}

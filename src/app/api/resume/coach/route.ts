import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/router';

export async function POST(req: Request) {
  try {
    const { document, jdAnalysis } = await req.json();

    if (!document) {
      return NextResponse.json({ success: false, error: "Resume document is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const prompt = `
      You are an elite Career Coach for Enterprise Tech Placements.
      Analyze the provided Resume Intelligence Profile and generate a structured 30/60/90-day learning and placement readiness roadmap.
      
      Return a JSON object matching this schema EXACTLY:
      {
        "currentLevel": "Intermediate",
        "placementReadiness": 72,
        "missingSkills": ["System Design", "AWS"],
        "roadmap": {
          "day30": ["Build a full-stack project", "Practice easy LeetCode"],
          "day60": ["Deploy to AWS", "Mock Interviews"],
          "day90": ["Apply to FAANG", "System Design Interview Prep"]
        }
      }

      Resume Intelligence:
      ${JSON.stringify(document.intelligence)}
    `;

    const aiRes = await AIRouter.generateJSON('matching', prompt, 'reasoning');

    if (!aiRes.success || !aiRes.data) {
      return NextResponse.json({ success: false, error: aiRes.error || "Failed to generate coaching plan", code: "AI_TIMEOUT", retryable: true }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiRes.data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

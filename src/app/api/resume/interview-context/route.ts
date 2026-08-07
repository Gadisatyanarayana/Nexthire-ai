import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/router';
import { ResumeRepository } from '@/lib/db/resume';

export async function POST(req: Request) {
  try {
    const { document, jobDescription, targetCompany, targetRole, userId, resumeId } = await req.json();

    if (!document || !userId || !resumeId) {
      return NextResponse.json({ success: false, error: "Missing required fields", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const prompt = `
      You are an elite Technical Recruiter constructing an Interview Context profile.
      Synthesize the candidate's Resume Intelligence and the Job Description into a structured context object that will be fed to an AI Voice Interviewer.
      
      Return a JSON object matching this schema EXACTLY:
      {
        "targetCompany": "${targetCompany || 'Unknown'}",
        "targetRole": "${targetRole || 'Unknown'}",
        "difficulty": "Medium",
        "focusAreas": ["System Design", "Behavioral Leadership", "React Deep Dive"],
        "generatedQuestions": [
          "I see you used React on your E-Commerce project. Can you explain how you handled state management?",
          "Your resume lacks direct AWS experience, how would you approach deploying this?"
        ]
      }

      Job Description:
      ${jobDescription || 'N/A'}

      Resume Intelligence:
      ${JSON.stringify(document.intelligence)}
    `;

    const aiRes = await AIRouter.generateJSON('matching', prompt, 'reasoning');

    if (!aiRes.success || !aiRes.data) {
      return NextResponse.json({ success: false, error: aiRes.error, code: "AI_TIMEOUT", retryable: true }, { status: 500 });
    }

    // Save context to database
    await ResumeRepository.saveInterviewContext(userId, aiRes.data, resumeId, targetCompany);

    return NextResponse.json({ success: true, data: aiRes.data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

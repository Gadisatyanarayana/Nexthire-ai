import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/router';

export async function POST(req: Request) {
  try {
    const { document, jobDescription } = await req.json();

    if (!document || !jobDescription) {
      return NextResponse.json({ success: false, error: "Resume document and Job Description are required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    // JD Matcher Pipeline: Separate parsing from matching
    // For performance in this API, we use a single comprehensive prompt, but structure it for the pipeline.
    
    const prompt = `
      You are an expert ATS Keyword Matcher and Technical Recruiter.
      Compare the provided Resume JSON against the Job Description.
      
      Perform these steps internally:
      1. JD Parser: Extract skills, role requirements, and tech stack from the JD.
      2. Resume Comparison: Compare against the resume.
      3. Recommendations: Generate structured feedback.
      
      Return a JSON object matching this schema EXACTLY:
      {
        "overallMatch": 75,
        "roleFit": 80,
        "technicalFit": 70,
        "softSkillsMatch": 90,
        "missingKeywords": ["Kubernetes", "AWS", "Agile"],
        "recommendedKeywords": ["Docker", "CI/CD"],
        "matchingProjects": ["E-Commerce Platform"]
      }

      Job Description:
      ${jobDescription}

      Resume JSON:
      ${JSON.stringify(document)}
    `;

    const aiRes = await AIRouter.generateJSON('matching', prompt, 'reasoning');

    if (!aiRes.success || !aiRes.data) {
      return NextResponse.json({ 
        success: false, 
        error: aiRes.error || "Failed to match JD",
        code: "AI_TIMEOUT",
        retryable: true 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiRes.data });

  } catch (error: any) {
    console.error("Resume Match Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to match JD", code: "INTERNAL_ERROR", retryable: false }, { status: 500 });
  }
}

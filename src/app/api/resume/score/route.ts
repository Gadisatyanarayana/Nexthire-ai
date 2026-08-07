import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/router';
import { ResumeDocument, ATSAnalysis } from '@/components/resume-builder/types';

export async function POST(req: Request) {
  try {
    const { document } = await req.json();

    if (!document) {
      return NextResponse.json({ success: false, error: "Resume document is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const doc = document as ResumeDocument;

    // 1. Rule Engine
    const ruleDeductions = [];
    const personalSec = doc.sections.find(s => s.type === 'personal')?.data;
    if (!personalSec?.email) ruleDeductions.push("Missing email address (-5)");
    if (!personalSec?.linkedin) ruleDeductions.push("Missing LinkedIn profile (-5)");
    if (!personalSec?.github) ruleDeductions.push("Missing GitHub profile (-3)");
    
    // 2. Statistical Engine
    const expSec = doc.sections.find(s => s.type === 'experience')?.data;
    const bulletCount = expSec?.items?.reduce((acc: number, item: any) => acc + (item.achievements?.length || 0), 0) || 0;
    if (bulletCount < 3) ruleDeductions.push("Insufficient experience bullet points (-10)");

    // 3. LLM Reviewer (Impact & Cohesiveness)
    const prompt = `
      You are an elite ATS (Applicant Tracking System) Analyzer for FAANG companies.
      Evaluate the provided Resume Document. The Rule and Statistical engines have already deducted points for:
      [${ruleDeductions.join(', ')}]

      Provide a semantic review assessing Content, Formatting, Readability, Keywords, and Impact.
      
      Return a JSON object matching this schema EXACTLY:
      {
        "overallScore": 85,
        "dimensions": {
          "content": 90,
          "formatting": 80,
          "readability": 85,
          "keywords": 70,
          "impact": 95
        },
        "review": {
          "strengths": ["Strong action verbs", "Clear project scope"],
          "weaknesses": ["Too many soft skills in skills section"],
          "recommendations": [
            { "text": "Quantify your impact at Google by adding specific percentages.", "priority": "HIGH" }
          ]
        }
      }

      Resume JSON:
      ${JSON.stringify(document)}
    `;

    const aiRes = await AIRouter.generateJSON('scoring', prompt, 'reasoning');

    if (!aiRes.success || !aiRes.data) {
      return NextResponse.json({ 
        success: false, 
        error: aiRes.error || "Failed to generate ATS score",
        code: "AI_TIMEOUT",
        retryable: true
      }, { status: 500 });
    }

    const analysis: ATSAnalysis = aiRes.data;

    return NextResponse.json({ success: true, data: analysis });

  } catch (error: any) {
    console.error("Resume ATS Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to analyze resume",
      code: "INTERNAL_ERROR",
      retryable: false
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const maxDuration = 60; // Allow AI endpoints more time to process on Vercel
import { JDMatchEngine } from '@/platform/ai/pipelines/jd_matcher/JDMatchEngine';
import { AICacheManager } from '@/platform/ai/cache/AICacheManager';
import { ResumeIntelligence } from '@/components/resume-builder/types';
import { AILogger } from '@/platform/ai/observability/AILogger';

export async function POST(req: Request, { params }: { params: Promise<{ resumeId: string }> }) {
  try {
    const resolvedParams = await params;
    const resumeId = resolvedParams.resumeId;

    const body = await req.json();
    const { intelligence, jobDescription } = body as { intelligence: ResumeIntelligence, jobDescription: string };

    if (!intelligence || !jobDescription) {
      return NextResponse.json({ success: false, error: 'Both intelligence and jobDescription are required' }, { status: 400 });
    }

    // Hash the job description to create a stable cache key
    const jdHash = crypto.createHash('sha256').update(jobDescription).digest('hex');
    const cacheKey = `${resumeId}-${intelligence.metadata.resumeHash}-${jdHash}`;

    // 1. Check Independent Cache namespace 'jd-match'
    const cachedMatch = await AICacheManager.get('jd-match', cacheKey);
    if (cachedMatch) {
       return NextResponse.json({ success: true, data: cachedMatch, cached: true });
    }

    // 2. Run JD Match Pipeline
    const matchResult = await JDMatchEngine.analyze(intelligence, jobDescription);

    // 3. Cache the result independently
    await AICacheManager.set('jd-match', cacheKey, matchResult);

    // 4. Track Analytics (mocked for now)
    try {
        AILogger.debug('JD Match Analytics would be stored here', { resumeId, cacheKey });
    } catch (e) {
        AILogger.warn('Failed to track JD Match analytics', { error: e, resumeId });
    }

    return NextResponse.json({ success: true, data: matchResult, cached: false });

  } catch (error: any) {
    console.error("JD Match Endpoint Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to analyze job description match",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

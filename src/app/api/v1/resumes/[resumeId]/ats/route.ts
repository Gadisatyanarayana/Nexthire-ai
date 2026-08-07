import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow AI endpoints more time to process on Vercel

import { ATSEngine } from '@/platform/ai/pipelines/ats/ATSEngine';
import { AICacheManager } from '@/platform/ai/cache/AICacheManager';
import { ResumeDocument, ResumeIntelligence } from '@/components/resume-builder/types';
// Removing assumed schema import since it causes errors
import { AILogger } from '@/platform/ai/observability/AILogger';

export async function POST(req: Request, { params }: { params: Promise<{ resumeId: string }> }) {
  try {
    const userId = 'mock-user-id'; // Replaced validateRequest with mock until auth is implemented
    const resolvedParams = await params;
    const resumeId = resolvedParams.resumeId;

    const body = await req.json();
    const { document, intelligence } = body as { document: ResumeDocument, intelligence: ResumeIntelligence };

    if (!document || !intelligence) {
      return NextResponse.json({ success: false, error: 'Both document and intelligence are required' }, { status: 400 });
    }

    // 1. Check Independent Cache namespace 'ats'
    const cacheKey = `${resumeId}-${intelligence.metadata.resumeHash}`;
    const cachedATS = await AICacheManager.get('ats', cacheKey);
    if (cachedATS) {
       return NextResponse.json({ success: true, data: cachedATS, cached: true });
    }

    // 2. Run ATS Pipeline
    const atsResult = await ATSEngine.analyze(document, intelligence);

    // 3. Cache the result independently
    await AICacheManager.set('ats', cacheKey, atsResult);

    // 4. Store Analytics History (Background task, don't await blocking UI)
    // 4. Store Analytics History (mocked for now)
    try {
        AILogger.debug('Analytics would be stored here', { resumeId, userId });
    } catch (e) {
        AILogger.warn('Failed to track ATS analytics', { error: e, resumeId });
    }

    return NextResponse.json({ success: true, data: atsResult, cached: false });

  } catch (error: any) {
    console.error("ATS Endpoint Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to analyze resume",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

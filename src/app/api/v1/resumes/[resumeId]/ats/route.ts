import { NextResponse } from 'next/server';
import { PlatformSecurityMiddleware } from '../../../../../platform/ai/middleware/PlatformSecurityMiddleware';
import { ATSEngine } from '../../../../../platform/ai/pipelines/ATSEngine';
import { AICacheManager } from '../../../../../platform/ai/cache/AICacheManager';
import { ResumeDocument, ResumeIntelligence } from '../../../../../components/resume-builder/types';
import { db } from '../../../../../db'; // Assumed DB
import { resumeAnalytics } from '../../../../../db/schema'; // Assumed DB Schema
import { AILogger } from '../../../../../platform/ai/observability/AILogger';

export async function POST(req: Request, { params }: { params: { resumeId: string } }) {
  try {
    const { userId } = await PlatformSecurityMiddleware.validateRequest(req);
    const { resumeId } = params;

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
    try {
        if (db && resumeAnalytics) {
            await db.insert(resumeAnalytics).values({
                resumeId,
                userId,
                score: atsResult.overallScore,
                breakdown: atsResult.dimensionScores,
                analyzedAt: new Date().toISOString()
            }).execute();
        }
    } catch (e) {
        AILogger.warn('Failed to track ATS analytics', e, { resumeId });
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

import { NextRequest } from 'next/server';
import { AdaptiveEngine, MasteryUpdateParams, SM2UpdateParams } from '@/lib/adaptive/AdaptiveEngine';
import { supabaseAdmin } from '@/lib/api/systemDesignV2';

export const runtime = 'edge';

/**
 * Syncs the student's progress to the Adaptive Engine and updates sd_mastery & sd_revision_queue
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      userId, 
      topicId, 
      currentMastery, 
      isCorrect, 
      difficulty, 
      hintsUsed,
      timeTakenSeconds,
      targetSeconds,
      currentSM2 
    } = await req.json();

    if (!userId || !topicId) {
      return new Response(JSON.stringify({ error: 'Missing required tracking fields' }), { status: 400 });
    }

    // 1. Calculate New Mastery Score
    const newMastery = AdaptiveEngine.calculateNewMastery({
      currentMastery: currentMastery || 0,
      isCorrect,
      difficulty,
      hintsUsed: hintsUsed || 0
    });

    // 2. Derive Quality for SM-2
    const quality = AdaptiveEngine.deriveQualityFromAttempt(isCorrect, timeTakenSeconds || 60, targetSeconds || 120);

    // 3. Calculate Spaced Repetition Next Review Date
    const nextReview = AdaptiveEngine.calculateSpacedRepetition({
      quality,
      reviewCount: currentSM2?.reviewCount || 0,
      interval: currentSM2?.interval || 1,
      easeFactor: currentSM2?.easeFactor || 2.5
    });

    // Real Upsert into PostgreSQL (sd_mastery and sd_revision_queue)
    await supabaseAdmin.from('sd_mastery').upsert({
      user_id: userId,
      topic_id: topicId,
      mastery_score: newMastery,
      last_assessed_at: new Date().toISOString()
    });

    await supabaseAdmin.from('sd_revision_queue').upsert({
      user_id: userId,
      topic_id: topicId,
      next_review_date: nextReview.nextReviewDate.toISOString(),
      interval: nextReview.interval,
      ease_factor: nextReview.easeFactor,
      review_count: nextReview.reviewCount,
      updated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      newMastery,
      nextReview
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Mastery API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

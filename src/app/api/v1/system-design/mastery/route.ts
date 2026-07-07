import { NextRequest } from 'next/server';
import { AdaptiveEngine, MasteryUpdateParams, SM2UpdateParams } from '@/lib/adaptive/AdaptiveEngine';

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

    // In a real flow, this data would be immediately Upserted into PostgreSQL (sd_mastery and sd_revision_queue).
    // e.g. await supabase.from('sd_mastery').upsert({ user_id, topic_id, mastery_score: newMastery })
    // e.g. await supabase.from('sd_revision_queue').upsert({ ...nextReview })

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

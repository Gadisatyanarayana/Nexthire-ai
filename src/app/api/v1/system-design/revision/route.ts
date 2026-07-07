import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/systemDesignV2';

export const runtime = 'edge';

/**
 * Fetches the topics that are due for revision based on the sd_revision_queue.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
    }

    // Query PostgreSQL for all topics where next_review_date <= NOW()
    const { data: queueData, error } = await supabaseAdmin
      .from('sd_revision_queue')
      .select('topic_id, next_review_date')
      .eq('user_id', userId)
      .lte('next_review_date', new Date().toISOString());

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      dueForRevision: queueData || []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Revision API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

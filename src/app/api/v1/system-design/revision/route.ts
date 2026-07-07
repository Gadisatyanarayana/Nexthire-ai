import { NextRequest } from 'next/server';

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

    // In a real flow, this queries PostgreSQL for all topics where next_review_date <= NOW()
    // e.g. await supabase.from('sd_revision_queue').select('*').eq('user_id', userId).lte('next_review_date', new Date().toISOString())
    
    // Mock response for Phase 4 architecture completion
    const mockRevisionQueue = [
      { topic_id: 'caching', next_review_date: new Date().toISOString() },
      { topic_id: 'load_balancing', next_review_date: new Date().toISOString() }
    ];

    return new Response(JSON.stringify({
      success: true,
      dueForRevision: mockRevisionQueue
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Revision API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

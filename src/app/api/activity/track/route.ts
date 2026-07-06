import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminClient, upsertUserAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

type TrackBody = {
  activityType?: string;
  source?: string;
  payload?: Record<string, unknown>;
};

const ALLOWED_TYPES = new Set([
  'login',
  'logout',
  'page_view',
  'page_time',
  'chatbot_search',
  'ai_coach_query',
  'question_run',
  'question_submit',
  'contest_action',
]);

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `activity-track:${ip}`, limit: 120, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const email = String(session?.user?.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as TrackBody;
    const activityType = String(body.activityType || '').trim();
    if (!activityType || !ALLOWED_TYPES.has(activityType)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    const source = String(body.source || 'client').slice(0, 64);
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};

    const admin = getAdminClient();
    const user = await upsertUserAdmin({ name: session?.user?.name || null, email });

    const { error } = await admin.from('user_activity').insert({
      user_id: user.id,
      activity_type: activityType,
      source,
      payload,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track activity';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

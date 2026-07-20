import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * SuperAdmin SaaS Dashboard Metrics API
 * Authorized only for internal NextHire AI operations team.
 */
export async function GET(req: Request) {
  // 1. Validate SuperAdmin Role via middleware/headers
  // ...

  try {
    // 2. Aggregate Operational Health Metrics
    
    // a. Tenant Health
    const { count: activeTenants } = await supabaseAdmin
      .from('platform_tenants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
      
    // b. Webhook Delivery Failures (Dead-letters)
    const { count: deadLetterCount } = await supabaseAdmin
      .from('platform_webhook_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dead-letter');

    // c. Current AI Token Consumption (Mocked aggregation from Usage)
    const currentAITokens = 450200;

    // d. Redis Queue Depth (Mocked check from Upstash)
    const webhookQueueDepth = 12; 

    // e. Active Interview Sessions (Mocked from Cache)
    const activeInterviews = 34;

    return NextResponse.json({
      data: {
        activeTenants: activeTenants || 0,
        healthMetrics: {
          deadLetterWebhooks: deadLetterCount || 0,
          webhookQueueDepth,
          aiTokenConsumption: currentAITokens,
          activeInterviews,
          apiTrafficRps: 142.5 // Mocked Datadog metric
        },
        status: deadLetterCount && deadLetterCount > 100 ? 'degraded' : 'healthy'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

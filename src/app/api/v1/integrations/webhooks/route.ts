import { NextResponse } from 'next/server';
import { WebhookManagementService } from '@/platform/integrations/services/WebhookManagementService';
import { z } from 'zod';

export async function GET(req: Request) {
  // In production, extract tenantId from the validated API Key Bearer token
  const tenantId = req.headers.get('x-tenant-id') || 'demo-tenant';
  
  try {
    const webhooks = await WebhookManagementService.listWebhooks(tenantId);
    return NextResponse.json({ data: webhooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const CreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1)
});

export async function POST(req: Request) {
  const tenantId = req.headers.get('x-tenant-id') || 'demo-tenant';
  
  try {
    const body = await req.json();
    const { url, events } = CreateSchema.parse(body);

    const webhook = await WebhookManagementService.createWebhook(tenantId, url, events);
    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

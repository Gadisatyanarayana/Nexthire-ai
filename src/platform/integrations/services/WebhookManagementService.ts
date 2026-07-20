import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { randomBytes } from 'crypto';
import { AuditLogger } from '@/platform/admin/services/AuditLogger';

export interface WebhookRecord {
  id: string;
  tenant_id: string;
  url: string;
  secret: string;
  active: boolean;
  events: string[];
}

export class WebhookManagementService {
  /**
   * Registers a new webhook subscription.
   */
  public static async createWebhook(
    tenantId: string,
    url: string,
    events: string[]
  ): Promise<WebhookRecord> {
    const secret = randomBytes(32).toString('base64url'); // Generate signing secret

    const { data, error } = await supabaseAdmin
      .from('platform_webhooks')
      .insert({
        tenant_id: tenantId,
        url,
        secret,
        events,
        active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }

    await AuditLogger.logEvent(tenantId, 'system', 'webhook_created', 'webhook', data.id, { url, events });

    return data as WebhookRecord;
  }

  /**
   * Retrieves all webhooks for a tenant.
   */
  public static async listWebhooks(tenantId: string): Promise<WebhookRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('platform_webhooks')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) return [];
    return data as WebhookRecord[];
  }

  /**
   * Pauses or Resumes a webhook.
   */
  public static async updateStatus(
    tenantId: string,
    webhookId: string,
    active: boolean
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('platform_webhooks')
      .update({ active })
      .eq('id', webhookId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to update webhook status: ${error.message}`);
    }

    await AuditLogger.logEvent(tenantId, 'system', active ? 'webhook_resumed' : 'webhook_paused', 'webhook', webhookId);
  }

  /**
   * Hard deletes a webhook subscription.
   */
  public static async deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('platform_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }

    await AuditLogger.logEvent(tenantId, 'system', 'webhook_deleted', 'webhook', webhookId);
  }

  /**
   * Manually replays a failed delivery.
   */
  public static async replayDelivery(
    tenantId: string, 
    webhookId: string, 
    deliveryId: string
  ): Promise<void> {
    // 1. Verify ownership
    const { data: webhook } = await supabaseAdmin
      .from('platform_webhooks')
      .select('id')
      .eq('id', webhookId)
      .eq('tenant_id', tenantId)
      .single();

    if (!webhook) throw new Error('Webhook not found or unauthorized');

    // 2. Fetch failed delivery
    const { data: delivery } = await supabaseAdmin
      .from('platform_webhook_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .eq('webhook_id', webhookId)
      .single();

    if (!delivery || delivery.status !== 'failed' && delivery.status !== 'dead-letter') {
      throw new Error('Delivery not found or not eligible for replay');
    }

    // 3. Reset status and push to Redis immediately (mocked here)
    await supabaseAdmin
      .from('platform_webhook_deliveries')
      .update({
        status: 'queued',
        attempts: 0,
        next_retry_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    await AuditLogger.logEvent(tenantId, 'system', 'webhook_delivery_replayed', 'webhook_delivery', deliveryId, { webhook_id: webhookId });
  }
}

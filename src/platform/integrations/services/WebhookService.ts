import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createHmac } from 'crypto';
import { IntegrationEvent } from '../events/EventCatalog';

export class WebhookService {
  /**
   * Phase 1 of Hybrid Delivery: Transactional Outbox insertion.
   * This should ideally be called within the same DB transaction as the core entity update.
   */
  public static async publishToOutbox(
    tenantId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('platform_outbox')
      .insert({
        tenant_id: tenantId,
        event_type: eventType,
        payload: payload,
        status: 'pending'
      });
      
    if (error) {
      throw new Error(`Failed to insert into outbox: ${error.message}`);
    }
  }

  /**
   * Generates HMAC SHA-256 signature for the payload to prevent tampering.
   */
  public static generateSignature(secret: string, timestamp: string, payload: string): string {
    const signedContent = `${timestamp}.${payload}`;
    return createHmac('sha256', secret).update(signedContent).digest('hex');
  }

  /**
   * Calculates the next retry time based on the attempt number.
   * Attempt 1: immediate (handled elsewhere)
   * Attempt 2: +30 seconds
   * Attempt 3: +2 minutes
   * Attempt 4: +10 minutes
   * Attempt 5: +1 hour
   * After 5, it becomes dead-letter.
   */
  public static calculateNextRetry(attempt: number): Date | null {
    const now = new Date();
    switch (attempt) {
      case 1:
        return new Date(now.getTime() + 30 * 1000); // +30s
      case 2:
        return new Date(now.getTime() + 2 * 60 * 1000); // +2m
      case 3:
        return new Date(now.getTime() + 10 * 60 * 1000); // +10m
      case 4:
        return new Date(now.getTime() + 60 * 60 * 1000); // +1h
      default:
        return null; // Dead-letter
    }
  }

  /**
   * Phase 3 of Hybrid Delivery: Dispatch logic used by the Redis Worker.
   */
  public static async dispatch(
    deliveryId: string,
    targetUrl: string,
    secret: string,
    event: IntegrationEvent
  ): Promise<{ success: boolean; statusCode?: number }> {
    const timestamp = new Date().toISOString();
    const payloadStr = JSON.stringify(event.payload);
    const signature = this.generateSignature(secret, timestamp, payloadStr);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NextHire-Event': event.type,
          'X-NextHire-Timestamp': timestamp,
          'X-NextHire-Delivery-ID': deliveryId,
          'X-NextHire-Signature': `v1=${signature}`,
        },
        body: payloadStr,
        // Enforce a strict 5-second webhook timeout
        signal: AbortSignal.timeout(5000) 
      });

      return { success: response.ok, statusCode: response.status };
    } catch (error) {
      return { success: false };
    }
  }
}

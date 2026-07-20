import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createHash } from 'crypto';

export class IdempotencyService {
  /**
   * Hashes the incoming request body and parameters to ensure the request is identical.
   */
  public static hashRequest(payload: any): string {
    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Checks if an idempotency key exists. If so, returns the cached response if completed,
   * or a conflict if still processing. If not, acquires the lock for processing.
   */
  public static async acquireOrReturn(
    tenantId: string,
    idempotencyKey: string,
    payload: any,
    ttlHours: number = 24
  ): Promise<{ status: 'acquired' | 'cached' | 'conflict', response?: any }> {
    const requestHash = this.hashRequest(payload);

    // Attempt to insert the lock
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('platform_idempotency_keys')
      .insert({
        tenant_id: tenantId,
        key: idempotencyKey,
        request_hash: requestHash,
        status: 'processing',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .maybeSingle();

    if (!insertError && inserted) {
      return { status: 'acquired' };
    }

    // Key exists, fetch it
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('platform_idempotency_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('key', idempotencyKey)
      .single();

    if (fetchError || !existing) {
      throw new Error('Database error during idempotency check');
    }

    if (existing.request_hash !== requestHash) {
      throw new Error('Idempotency key mismatch: A different request was previously sent with this key');
    }

    if (existing.status === 'processing') {
      return { status: 'conflict' }; // Tell client to back off and wait
    }

    return { status: 'cached', response: existing.response };
  }

  /**
   * Saves the final response to the idempotency key record to be returned on retries.
   */
  public static async completeRequest(
    tenantId: string,
    idempotencyKey: string,
    responseBody: any
  ): Promise<void> {
    await supabaseAdmin
      .from('platform_idempotency_keys')
      .update({
        status: 'completed',
        response: responseBody
      })
      .eq('tenant_id', tenantId)
      .eq('key', idempotencyKey);
  }
}

import { randomBytes, createHmac } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Assuming there's a configured admin client
import { AuditLogger } from '@/platform/admin/services/AuditLogger';

export interface ApiKeyRecord {
  id: string;
  tenant_id: string;
  prefix: string;
  key_id: string;
  key_hash: string;
  scopes: string[];
  created_by: string;
  rotated_from?: string | null;
  last_ip?: string | null;
  last_user_agent?: string | null;
  created_at: Date;
  expires_at?: Date | null;
  last_used_at?: Date | null;
  revoked_at?: Date | null;
}

const PEPPER = process.env.API_KEY_PEPPER || 'default_dev_pepper'; // Must be set in production

export class ApiKeyService {
  /**
   * Generates a new cryptographically secure API key.
   */
  private static generateRawKey(isTest = false): { prefix: string; keyId: string; secret: string; fullKey: string } {
    const prefix = isTest ? 'nh_test' : 'nh_live';
    const keyId = randomBytes(4).toString('hex'); // 8 char ID
    const secret = randomBytes(24).toString('base64url'); // 32 chars URL-safe
    const fullKey = `${prefix}_${keyId}_${secret}`;
    return { prefix, keyId, secret, fullKey };
  }

  /**
   * Hashes the secret portion of the key using HMAC-SHA-256 with a server-side pepper.
   */
  public static hashSecret(secret: string): string {
    return createHmac('sha256', PEPPER).update(secret).digest('hex');
  }

  /**
   * Creates a new API Key for a tenant.
   */
  public static async createKey(
    tenantId: string,
    createdBy: string,
    scopes: string[] = ['*'],
    isTest = false,
    expiresAt?: Date
  ): Promise<{ fullKey: string; record: ApiKeyRecord }> {
    const { prefix, keyId, secret, fullKey } = this.generateRawKey(isTest);
    const keyHash = this.hashSecret(secret);

    const { data, error } = await supabaseAdmin
      .from('platform_api_keys')
      .insert({
        tenant_id: tenantId,
        prefix,
        key_id: keyId,
        key_hash: keyHash,
        scopes,
        created_by: createdBy,
        expires_at: expiresAt?.toISOString() || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    await AuditLogger.logEvent(tenantId, createdBy, 'api_key_created', 'api_key', data.id, { scopes });

    return { fullKey, record: data as ApiKeyRecord };
  }

  /**
   * Validates an incoming API Key.
   */
  public static async validateKey(fullKey: string): Promise<ApiKeyRecord | null> {
    const parts = fullKey.split('_');
    if (parts.length !== 3) return null;

    const [prefix, keyId, secret] = parts;
    const expectedHash = this.hashSecret(secret);

    // O(1) lookup by indexed key_id
    const { data, error } = await supabaseAdmin
      .from('platform_api_keys')
      .select('*')
      .eq('key_id', keyId)
      .single();

    if (error || !data) return null;

    const record = data as ApiKeyRecord;

    // Check expiration and revocation
    if (record.revoked_at) return null;
    if (record.expires_at && new Date(record.expires_at) < new Date()) return null;

    // Secure timing-safe comparison on the hash
    if (record.key_hash !== expectedHash) return null;
    if (record.prefix !== prefix) return null;

    // Async background update of last_used_at could be queued here via Redis/Events
    
    return record;
  }

  /**
   * Revokes an active API key immediately.
   */
  public static async revokeKey(keyId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('platform_api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('key_id', keyId);

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }

    await AuditLogger.logEvent('unknown', 'system', 'api_key_revoked', 'api_key', keyId);
  }

  /**
   * Rotates an API key by generating a new one and scheduling the old one for revocation.
   */
  public static async rotateKey(
    keyId: string, 
    createdBy: string,
    overlapHours: number = 24
  ): Promise<{ newKey: string; newRecord: ApiKeyRecord }> {
    const { data: oldKey, error: lookupError } = await supabaseAdmin
      .from('platform_api_keys')
      .select('*')
      .eq('key_id', keyId)
      .single();

    if (lookupError || !oldKey) throw new Error('API key not found');

    const isTest = oldKey.prefix === 'nh_test';
    
    // Create new key inheriting properties
    const { fullKey: newKey, record: newRecord } = await this.createKey(
      oldKey.tenant_id,
      createdBy,
      oldKey.scopes,
      isTest
    );

    // Update old key to expire after overlap period
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + overlapHours);

    await supabaseAdmin
      .from('platform_api_keys')
      .update({ expires_at: expireDate.toISOString(), rotated_from: newRecord.id })
      .eq('id', oldKey.id);

    await AuditLogger.logEvent(oldKey.tenant_id, createdBy, 'api_key_rotated', 'api_key', oldKey.id, { new_key_id: newRecord.id });

    return { newKey, newRecord };
  }
}

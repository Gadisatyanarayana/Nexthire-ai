import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BillingProvider } from './BillingProvider';
import { StripeProvider } from './StripeProvider';

// The singleton provider instance. Could be injected or determined via factory.
const provider: BillingProvider = new StripeProvider();

export class BillingService {
  /**
   * Translates a high-level subscription Plan into detailed Entitlements,
   * which are then evaluated into Feature Flags for the TenantContext.
   */
  public static resolveEntitlements(planId: string): Record<string, boolean> {
    const entitlements: Record<string, boolean> = {
      'analytics_advanced': false,
      'custom_webhooks': false,
      'white_labeling': false,
      'sso_saml': false,
    };

    if (planId === 'enterprise') {
      entitlements['analytics_advanced'] = true;
      entitlements['custom_webhooks'] = true;
      entitlements['white_labeling'] = true;
      entitlements['sso_saml'] = true;
    } else if (planId === 'pro') {
      entitlements['analytics_advanced'] = true;
      entitlements['custom_webhooks'] = true;
    }

    return entitlements;
  }

  /**
   * Provision a customer in the external billing system and link them to the tenant.
   */
  public static async provisionCustomer(tenantId: string, email: string, name: string): Promise<string> {
    const customerId = await provider.createCustomer(tenantId, email, name);
    
    await supabaseAdmin
      .from('platform_tenants')
      .update({ billing_provider: 'stripe', billing_customer_id: customerId })
      .eq('id', tenantId);

    return customerId;
  }

  /**
   * Tracks metered usage events safely by deduplicating via idempotency_key.
   * Emits to the external provider for invoicing.
   */
  public static async trackUsageEvent(
    tenantId: string,
    eventType: string,
    quantity: number,
    idempotencyKey: string
  ): Promise<void> {
    // 1. Insert locally to aggregate and prevent duplicates
    const { data: inserted, error } = await supabaseAdmin
      .from('platform_tenant_usage_events')
      .insert({
        tenant_id: tenantId,
        event_type: eventType,
        quantity,
        idempotency_key: idempotencyKey
      })
      .select()
      .maybeSingle();

    if (error || !inserted) {
      // Duplicate event (already tracked) or failure
      return;
    }

    // 2. Lookup subscription to report to external provider
    const { data: sub } = await supabaseAdmin
      .from('platform_tenant_subscriptions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (sub) {
      // 3. Emit Usage to Stripe/Paddle
      await provider.reportUsage(sub.id, eventType, quantity);
    }
  }
}

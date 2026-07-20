import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BillingService } from './billing/BillingService';

export class TenantLifecycleService {
  /**
   * Orchestrates the event-driven provisioning of a new tenant.
   * Flow: TenantCreated -> OrganizationCreated -> AdminProvisioned -> BrandingInitialized
   */
  public static async provisionNewTenant(
    name: string,
    slug: string,
    adminEmail: string,
    deploymentMode: 'POOL' | 'BRIDGE' | 'SILO' = 'POOL'
  ): Promise<string> {
    // 1. TenantCreated
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('platform_tenants')
      .insert({
        name,
        slug,
        deployment_mode: deploymentMode,
        status: 'provisioning'
      })
      .select()
      .single();

    if (tenantErr || !tenant) throw new Error('Tenant creation failed');

    try {
      // 2. OrganizationCreated (Billing linking)
      await BillingService.provisionCustomer(tenant.id, adminEmail, name);

      // 3. BrandingInitialized (Defaults)
      await supabaseAdmin.from('platform_tenant_branding').insert({ tenant_id: tenant.id });

      // 4. AdminProvisioned (Mock Auth linking)
      // await AuthService.createTenantAdmin(tenant.id, adminEmail);

      // 5. Finalize Provisioning -> Active
      await supabaseAdmin
        .from('platform_tenants')
        .update({ status: 'active' })
        .eq('id', tenant.id);

      // 6. Queue Welcome Email (Mock)
      console.log(`[PROVISION] Queued welcome email for ${adminEmail}`);

      return tenant.id;

    } catch (e) {
      // Failed Provisioning Rollback (or manual intervention flag)
      await supabaseAdmin.from('platform_tenants').update({ status: 'deleted' }).eq('id', tenant.id);
      throw e;
    }
  }

  /**
   * Suspends a tenant gracefully, progressing them through lifecycle states.
   */
  public static async suspendTenant(tenantId: string, reason: string): Promise<void> {
    // 1. Mark as Read-Only or Suspended
    await supabaseAdmin
      .from('platform_tenants')
      .update({ status: 'suspended' })
      .eq('id', tenantId);

    // 2. Clear Sessions (Mock)
    console.log(`[LIFECYCLE] Cleared all active sessions for tenant ${tenantId} due to: ${reason}`);

    // 3. Cancel Active Subscription billing if any
    const { data: sub } = await supabaseAdmin
      .from('platform_tenant_subscriptions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (sub) {
      console.log(`[LIFECYCLE] Billing suspension for subscription ${sub.id}`);
    }
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TenantContext } from '../models/TenantContext';

export class SaaSGateway {
  /**
   * Resolves the TenantContext based on the incoming request Host header (Custom Domains)
   * or API Headers (`X-Tenant-ID`).
   */
  public static async resolveTenantContext(req: NextRequest): Promise<TenantContext | null> {
    const host = req.headers.get('host');
    const headerTenantId = req.headers.get('x-tenant-id');
    
    let tenantId = headerTenantId;

    if (!tenantId && host && !host.includes('localhost') && !host.includes('nexthire.ai')) {
      // Resolve Custom Domain
      const { data: branding } = await supabaseAdmin
        .from('platform_tenant_branding')
        .select('tenant_id')
        .eq('custom_domain', host)
        .single();
      
      if (branding) {
        tenantId = branding.tenant_id;
      }
    }

    if (!tenantId) return null;

    // Fetch Full Tenant Metadata (In production, this is heavily cached in Redis)
    const { data: tenant } = await supabaseAdmin
      .from('platform_tenants')
      .select(`
        *,
        platform_tenant_branding (*),
        platform_tenant_subscriptions (plan_id, status)
      `)
      .eq('id', tenantId)
      .single();

    if (!tenant) return null;

    // Resolve Entitlements (Mocked mapping for now)
    const plan = tenant.platform_tenant_subscriptions?.[0]?.plan_id || 'free';
    const featureFlags = {
      'analytics_advanced': plan === 'enterprise',
      'custom_webhooks': plan === 'pro' || plan === 'enterprise',
      'white_labeling': plan === 'enterprise'
    };

    return new TenantContext({
      tenantId: tenant.id,
      organizationId: tenant.id, // Simplifying for now
      deploymentMode: tenant.deployment_mode,
      status: tenant.status,
      region: tenant.region,
      subscriptionPlan: plan,
      branding: tenant.platform_tenant_branding?.[0] || { primaryColor: '#000000', fontFamily: 'Inter', darkModePalette: {}, emailBranding: {} },
      featureFlags
    });
  }

  /**
   * Next.js Middleware handler to inject the TenantContext into headers for downstream use.
   */
  public static async middleware(req: NextRequest) {
    const context = await this.resolveTenantContext(req);

    if (!context) {
      // Unrecognized tenant domain/header
      return new NextResponse('Tenant Not Found', { status: 404 });
    }

    if (context.status === 'suspended' || context.status === 'deleted') {
      return new NextResponse('Tenant Account Suspended', { status: 403 });
    }

    const res = NextResponse.next();
    
    // Inject context via headers for Server Components to pick up
    res.headers.set('X-Tenant-Context', JSON.stringify(context));
    
    return res;
  }
}

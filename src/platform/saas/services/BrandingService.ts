import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BrandingConfig } from '../models/TenantContext';

export class BrandingService {
  /**
   * Updates a tenant's branding configuration.
   * This handles enterprise white-labeling updates (logos, domains, email templates, dark mode).
   */
  public static async updateBranding(
    tenantId: string,
    updates: Partial<BrandingConfig>
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('platform_tenant_branding')
      .update({
        custom_domain: updates.customDomain,
        logo_url: updates.logoUrl,
        favicon_url: updates.faviconUrl,
        primary_color: updates.primaryColor,
        font_family: updates.fontFamily,
        dark_mode_palette: updates.darkModePalette,
        email_branding: updates.emailBranding,
        login_background_url: updates.loginBackgroundUrl,
        support_url: updates.supportUrl,
        privacy_policy_url: updates.privacyPolicyUrl,
        terms_url: updates.termsUrl,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to update branding: ${error.message}`);
    }

    // In production, emit a cache invalidation event here (e.g. to Redis)
    // so the SaaSGateway middleware picks up the new branding immediately.
  }

  /**
   * Injects the resolved branding configuration into dynamic CSS variables.
   * This is consumed by the Next.js RootLayout.
   */
  public static generateCssVariables(branding: BrandingConfig): string {
    return `
      :root {
        --tenant-primary-color: ${branding.primaryColor || '#000000'};
        --tenant-font-family: '${branding.fontFamily || 'Inter'}', sans-serif;
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          --tenant-bg-dark: ${branding.darkModePalette?.background || '#121212'};
          --tenant-text-dark: ${branding.darkModePalette?.text || '#ffffff'};
        }
      }
    `;
  }
}

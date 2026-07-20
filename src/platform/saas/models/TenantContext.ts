export type DeploymentMode = 'POOL' | 'BRIDGE' | 'SILO';
export type TenantStatus = 'provisioning' | 'active' | 'grace_period' | 'read_only' | 'suspended' | 'archived' | 'deleted';

export interface BrandingConfig {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  fontFamily: string;
  darkModePalette: Record<string, string>;
  emailBranding: Record<string, string>;
  loginBackgroundUrl?: string;
  supportUrl?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  customDomain?: string;
}

export interface FeatureFlags {
  [featureKey: string]: boolean;
}

export class TenantContext {
  public readonly tenantId: string;
  public readonly organizationId: string;
  public readonly deploymentMode: DeploymentMode;
  public readonly status: TenantStatus;
  public readonly region: string;
  public readonly subscriptionPlan: string;
  public readonly branding: BrandingConfig;
  public readonly featureFlags: FeatureFlags;

  constructor(data: {
    tenantId: string;
    organizationId: string;
    deploymentMode: DeploymentMode;
    status: TenantStatus;
    region: string;
    subscriptionPlan: string;
    branding: BrandingConfig;
    featureFlags: FeatureFlags;
  }) {
    this.tenantId = data.tenantId;
    this.organizationId = data.organizationId;
    this.deploymentMode = data.deploymentMode;
    this.status = data.status;
    this.region = data.region;
    this.subscriptionPlan = data.subscriptionPlan;
    this.branding = data.branding;
    this.featureFlags = data.featureFlags;
    
    // Freeze the context to ensure immutability throughout the request lifecycle
    Object.freeze(this);
    Object.freeze(this.branding);
    Object.freeze(this.featureFlags);
  }

  /**
   * Helper method to verify if a feature is enabled for this tenant.
   */
  public hasFeature(featureKey: string): boolean {
    return this.featureFlags[featureKey] === true;
  }
}

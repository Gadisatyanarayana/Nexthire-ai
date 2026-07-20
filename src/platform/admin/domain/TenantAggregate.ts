import { Tenant, FeatureFlag } from '../../contracts/admin';

export class TenantAggregate {
  private _tenant: Tenant;
  private _flags: FeatureFlag[];

  private constructor(tenant: Tenant, flags: FeatureFlag[]) {
    this._tenant = tenant;
    this._flags = flags;
  }

  public static hydrate(tenant: Tenant, flags: FeatureFlag[]): TenantAggregate {
    return new TenantAggregate(tenant, flags);
  }

  public get tenant(): Tenant {
    return this._tenant;
  }

  public isFeatureEnabled(featureKey: string): boolean {
    const flag = this._flags.find(f => f.featureKey === featureKey);
    return flag ? flag.isEnabled : false;
  }

  public checkQuota(quotaKey: string, currentUsage: number, requestedAmount: number): boolean {
    const limit = this._tenant.quotas[quotaKey];
    if (limit === undefined) {
      // If no quota is defined, assume unlimited or fallback to a global default
      return true;
    }
    return (currentUsage + requestedAmount) <= limit;
  }

  public suspend(): void {
    this._tenant.status = 'suspended';
  }
}

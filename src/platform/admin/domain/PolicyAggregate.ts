import { Policy } from '../../contracts/admin';

export class PolicyAggregate {
  private _policies: Policy[];

  private constructor(policies: Policy[]) {
    this._policies = policies;
  }

  public static hydrate(policies: Policy[]): PolicyAggregate {
    return new PolicyAggregate(policies);
  }

  public evaluate(
    tenantId: string, 
    roleId: string, 
    resourceType: string, 
    action: string, 
    resourceContext: Record<string, any>
  ): boolean {
    const applicablePolicies = this._policies.filter(
      p => p.tenantId === tenantId && p.roleId === roleId && p.resourceType === resourceType && p.action === action
    );

    if (applicablePolicies.length === 0) {
      return false; // Default deny
    }

    // If any applicable policy passes its condition (or has no condition), allow access.
    return applicablePolicies.some(policy => {
      if (!policy.condition) return true;

      const contextValue = resourceContext[policy.condition.field];
      if (contextValue === undefined) return false;

      switch (policy.condition.operator) {
        case 'eq':
          return contextValue === policy.condition.value;
        case 'startsWith':
          return typeof contextValue === 'string' && contextValue.startsWith(policy.condition.value);
        case 'contains':
          return Array.isArray(contextValue) && contextValue.includes(policy.condition.value);
        case 'in':
          return Array.isArray(policy.condition.value) && policy.condition.value.includes(contextValue);
        default:
          return false;
      }
    });
  }
}

/**
 * Feature Flag Bounded Context
 * Controls granular rollouts across multiple tenants and user cohorts.
 */

export enum Feature {
  AI_TUTOR_BETA = 'AI_TUTOR_BETA',
  NEW_IDE_LAYOUT = 'NEW_IDE_LAYOUT',
  ADAPTIVE_MOCKS = 'ADAPTIVE_MOCKS',
  BULK_IMPORT_V2 = 'BULK_IMPORT_V2'
}

export interface FeatureContext {
  userId: string;
  tenantId: string;
  role: 'Admin' | 'Faculty' | 'Student';
}

export interface IFeatureFlagService {
  isEnabled(feature: Feature, context: FeatureContext): Promise<boolean>;
  
  // Administrative Methods
  enableForTenant(feature: Feature, tenantId: string): Promise<void>;
  enableForRole(feature: Feature, role: string): Promise<void>;
  setPercentageRollout(feature: Feature, percentage: number): Promise<void>; // 0 - 100
}

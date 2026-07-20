export interface Tenant {
  id: string;
  name: string;
  domainMapping?: string;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  quotas: Record<string, number>;
  status: 'active' | 'suspended';
}

export interface FeatureFlag {
  tenantId: string;
  featureKey: string;
  isEnabled: boolean;
}

export type OrganizationNodeType = 'institution' | 'campus' | 'school' | 'department' | 'program' | 'branch' | 'academic_year' | 'semester' | 'section' | 'batch' | 'cohort';

export interface OrganizationNode {
  id: string;
  tenantId: string;
  parentId: string | null;
  nodeType: OrganizationNodeType;
  name: string;
  code?: string;
  path: string; // e.g. "/inst_1/camp_2/dept_3"
  depth: number;
  status: 'active' | 'archived';
  metadata: Record<string, any>;
}

export interface Policy {
  id: string;
  tenantId: string;
  roleId: string;
  resourceType: string;
  action: string;
  condition?: {
    field: string;
    operator: 'eq' | 'in' | 'startsWith' | 'contains';
    value: any;
  };
}

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  roleId: string;
  targetNodeId?: string; // Optional specific org node context
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  invitedBy: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceId: string;
  resourceType: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  geo?: string;
  correlationId?: string;
  timestamp: Date;
}

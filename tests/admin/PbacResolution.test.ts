import { PolicyAggregate } from '../../src/platform/admin/domain/PolicyAggregate';
import { Policy } from '../../src/platform/contracts/admin';

describe('PBAC Resolution Tests', () => {
  it('should allow access if policy condition matches', () => {
    const policies: Policy[] = [
      {
        id: 'pol-1',
        tenantId: 'tenant-A',
        roleId: 'role-campus-admin',
        resourceType: 'student',
        action: 'manage',
        condition: {
          field: 'campusId',
          operator: 'eq',
          value: 'camp-1'
        }
      }
    ];

    const pbac = PolicyAggregate.hydrate(policies);

    // Context matches
    const resultAllowed = pbac.evaluate('tenant-A', 'role-campus-admin', 'student', 'manage', { campusId: 'camp-1' });
    expect(resultAllowed).toBe(true);

    // Context does not match
    const resultDenied = pbac.evaluate('tenant-A', 'role-campus-admin', 'student', 'manage', { campusId: 'camp-2' });
    expect(resultDenied).toBe(false);
  });

  it('should support hierarchy paths with startsWith operator', () => {
    const policies: Policy[] = [
      {
        id: 'pol-2',
        tenantId: 'tenant-A',
        roleId: 'role-inst-admin',
        resourceType: 'cohort',
        action: 'view',
        condition: {
          field: 'orgPath',
          operator: 'startsWith',
          value: '/inst-1'
        }
      }
    ];

    const pbac = PolicyAggregate.hydrate(policies);

    // Allowed because the cohort path starts with /inst-1
    const allowed = pbac.evaluate('tenant-A', 'role-inst-admin', 'cohort', 'view', { orgPath: '/inst-1/camp-1/dept-1/cohort-1' });
    expect(allowed).toBe(true);

    // Denied because it is a different institution
    const denied = pbac.evaluate('tenant-A', 'role-inst-admin', 'cohort', 'view', { orgPath: '/inst-2/camp-1' });
    expect(denied).toBe(false);
  });

  it('should default deny if no policy matches', () => {
    const pbac = PolicyAggregate.hydrate([]);
    const denied = pbac.evaluate('tenant-A', 'role-unknown', 'student', 'view', {});
    expect(denied).toBe(false);
  });
});

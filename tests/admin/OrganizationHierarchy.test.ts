import { OrganizationAggregate } from '../../src/platform/admin/domain/OrganizationAggregate';
import { OrganizationNode } from '../../src/platform/contracts/admin';

describe('OrganizationHierarchy Domain Tests', () => {
  it('should create a valid hierarchy and compute depths and paths correctly', () => {
    // Root Institution
    const inst = OrganizationAggregate.createNode(
      'inst-1',
      'tenant-A',
      'Global University',
      'institution',
      null
    );

    expect(inst.node.depth).toBe(0);
    expect(inst.node.path).toBe('/inst-1');
    expect(inst.node.parentId).toBeNull();

    // Child Campus
    const campus = OrganizationAggregate.createNode(
      'camp-1',
      'tenant-A',
      'North Campus',
      'campus',
      inst.node
    );

    expect(campus.node.depth).toBe(1);
    expect(campus.node.path).toBe('/inst-1/camp-1');
    expect(campus.node.parentId).toBe('inst-1');

    // Grandchild Department
    const dept = OrganizationAggregate.createNode(
      'dept-1',
      'tenant-A',
      'Computer Science',
      'department',
      campus.node
    );

    expect(dept.node.depth).toBe(2);
    expect(dept.node.path).toBe('/inst-1/camp-1/dept-1');
    expect(dept.node.parentId).toBe('camp-1');
  });

  it('should correctly evaluate descendant relationships based on materialized paths', () => {
    const instNode: OrganizationNode = {
      id: 'inst-1', tenantId: 'tenant-A', parentId: null,
      nodeType: 'institution', name: 'Global U', path: '/inst-1', depth: 0,
      status: 'active', metadata: {}
    };

    const deptNode: OrganizationNode = {
      id: 'dept-1', tenantId: 'tenant-A', parentId: 'camp-1',
      nodeType: 'department', name: 'CS', path: '/inst-1/camp-1/dept-1', depth: 2,
      status: 'active', metadata: {}
    };

    const deptAgg = OrganizationAggregate.hydrate(deptNode);

    // Dept is descendant of Inst
    expect(deptAgg.isDescendantOf(instNode)).toBe(true);

    // Should fail across tenants
    const otherInstNode: OrganizationNode = { ...instNode, tenantId: 'tenant-B' };
    expect(deptAgg.isDescendantOf(otherInstNode)).toBe(false);
  });
});

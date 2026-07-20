import { OrganizationNode, OrganizationNodeType } from '../../contracts/admin';

export class OrganizationAggregate {
  private _node: OrganizationNode;

  private constructor(node: OrganizationNode) {
    this._node = node;
  }

  public static createNode(
    id: string,
    tenantId: string,
    name: string,
    nodeType: OrganizationNodeType,
    parentNode: OrganizationNode | null
  ): OrganizationAggregate {
    const parentId = parentNode ? parentNode.id : null;
    const depth = parentNode ? parentNode.depth + 1 : 0;
    const path = parentNode ? `${parentNode.path}/${id}` : `/${id}`;

    return new OrganizationAggregate({
      id,
      tenantId,
      parentId,
      nodeType,
      name,
      path,
      depth,
      status: 'active',
      metadata: {}
    });
  }

  public static hydrate(node: OrganizationNode): OrganizationAggregate {
    return new OrganizationAggregate(node);
  }

  public get node(): OrganizationNode {
    return this._node;
  }

  public archive(): void {
    this._node.status = 'archived';
  }

  public isDescendantOf(potentialAncestor: OrganizationNode): boolean {
    if (this._node.tenantId !== potentialAncestor.tenantId) {
      return false;
    }
    // E.g., Ancestor path "/A" -> descendant path "/A/B/C"
    return this._node.path.startsWith(`${potentialAncestor.path}/`);
  }
}

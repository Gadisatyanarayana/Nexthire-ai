import { Invitation } from '../../contracts/admin';

export class InvitationAggregate {
  private _invitation: Invitation;

  private constructor(invitation: Invitation) {
    this._invitation = invitation;
  }

  public static create(
    id: string,
    tenantId: string,
    email: string,
    roleId: string,
    invitedBy: string,
    targetNodeId?: string,
    validityDays: number = 7
  ): InvitationAggregate {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    return new InvitationAggregate({
      id,
      tenantId,
      email,
      roleId,
      targetNodeId,
      invitedBy,
      status: 'pending',
      expiresAt
    });
  }

  public static hydrate(invitation: Invitation): InvitationAggregate {
    return new InvitationAggregate(invitation);
  }

  public get invitation(): Invitation {
    return this._invitation;
  }

  public accept(): void {
    if (this._invitation.status !== 'pending') {
      throw new Error(`Cannot accept invitation in status ${this._invitation.status}`);
    }
    if (new Date() > this._invitation.expiresAt) {
      this._invitation.status = 'expired';
      throw new Error('Invitation has expired');
    }
    this._invitation.status = 'accepted';
  }

  public revoke(): void {
    if (this._invitation.status !== 'pending') {
      throw new Error(`Cannot revoke invitation in status ${this._invitation.status}`);
    }
    this._invitation.status = 'revoked';
  }
}

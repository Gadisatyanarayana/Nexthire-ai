import { AuditLog } from '../../contracts/admin';
import { v4 as uuidv4 } from 'uuid';

export class EnterpriseAuditLogger {
  private _logs: AuditLog[] = []; // In-memory mock for outbox/event bus

  public async logEvent(
    tenantId: string,
    actorId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    context?: {
      oldValue?: Record<string, any>;
      newValue?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      geo?: string;
      correlationId?: string;
    }
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      tenantId,
      actorId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date(),
      ...context
    };

    // Typically this would persist to Postgres and emit an EventBus message
    this._logs.push(log);
    
    // Simulate async IO delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  public getLogsForTenant(tenantId: string): AuditLog[] {
    return this._logs.filter(log => log.tenantId === tenantId);
  }
}

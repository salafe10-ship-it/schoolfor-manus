// src/modules/audit/domain/AuditLog.ts
import { Entity } from '../../shared-kernel/domain/Entity';

interface AuditLogProps {
  tenantId: string;
  schoolId?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditLog extends Entity<AuditLogProps> {
  constructor(props: AuditLogProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<AuditLogProps, 'createdAt'>): AuditLog {
    return new AuditLog({
      ...props,
      createdAt: new Date(),
    });
  }
}

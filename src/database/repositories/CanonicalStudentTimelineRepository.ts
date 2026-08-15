import { DatabaseError, ValidationError } from '../../utils/errors';
import type { TenantContext } from '../../tenant/TenantContext';
import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';

export type StudentTimelineEvent = {
  id: string;
  type: string;
  date: string;
  title: string;
  description: string;
  user: string;
};

type CanonicalAuditEventRow = {
  id: string;
  action: string;
  reason: string | null;
  actor_user_id: string | null;
  actor_service_account_id: string | null;
  created_at: string;
};

function timelineTitle(action: string, reason: string | null): string {
  const normalizedAction = action.trim().toUpperCase();
  const normalizedReason = (reason || '').trim();
  if (['CREATE', 'INSERT', 'REGISTER'].includes(normalizedAction) || /إنشاء|تسجيل/.test(normalizedReason)) {
    return 'إنشاء وتوثيق قيد الطالب';
  }
  if (['SOFT_DELETE', 'ARCHIVE'].includes(normalizedAction) || /حذف ناعم|تجميد|أرشفة/.test(normalizedReason)) {
    return normalizedAction === 'ARCHIVE' || normalizedReason.includes('أرشفة')
      ? 'نقل للأرشيف التاريخي'
      : 'تجميد الحساب (حذف ناعم)';
  }
  if (['RESTORE', 'ACTIVATE'].includes(normalizedAction) || /فك التجميد|تنشيط/.test(normalizedReason)) {
    return 'إعادة تنشيط القيد';
  }
  if (/نقل|شعبة|صف/.test(normalizedReason)) return 'تعديل المسار / النقل';
  if (/ترقية/.test(normalizedReason)) return 'ترقية سنوية';
  if (/تخرج/.test(normalizedReason)) return 'اعتماد التخرج وإقفال السجل';
  if (/فصل|تأديب/.test(normalizedReason)) return 'قرار فصل / تعليق تأديبي';
  if (/وثيق|ملف|مستند/.test(normalizedReason)) return 'إدارة الوثائق الثبوتية';
  if (/فاتورة|رسوم|سداد/.test(normalizedReason)) return 'الحسابات والرسوم';
  return 'تحديث في السجل';
}

function mapTimelineEvent(row: CanonicalAuditEventRow): StudentTimelineEvent {
  return {
    id: row.id,
    type: row.action,
    date: row.created_at,
    title: timelineTitle(row.action, row.reason),
    description: row.reason || 'تم تسجيل حدث موثق للطالب.',
    user: row.actor_user_id || row.actor_service_account_id || 'النظام الآلي'
  };
}

async function readTimeline(transaction: TransactionSession, context: TenantContext, studentId: string): Promise<StudentTimelineEvent[]> {
  const result = await transaction.query<CanonicalAuditEventRow>(
    `SELECT id, action, reason, actor_user_id, actor_service_account_id, created_at
       FROM public.audit_events
      WHERE tenant_id = $1
        AND school_id = $2
        AND branch_id = $3
        AND entity_type = 'student'
        AND entity_id = $4
        AND result = 'success'
      ORDER BY created_at DESC, id DESC`,
    [context.tenantId, context.schoolId, context.branchId, studentId]
  );
  return result.rows.map(mapTimelineEvent);
}

export class CanonicalStudentTimelineRepository {
  public static async getTimeline(context: TenantContext, studentId: string): Promise<StudentTimelineEvent[]> {
    if (!context) throw new DatabaseError('Trusted tenant context is required before Student timeline access.');
    if (!studentId || typeof studentId !== 'string') throw new ValidationError('Student identifier is required.');
    if (!UnitOfWork.hasTransactionDriver()) {
      throw new DatabaseError('Canonical Student timeline requires the configured PostgreSQL transaction driver.');
    }

    const executeRead = async () => {
      const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!transaction) throw new DatabaseError('Canonical Student timeline transaction is unavailable.');
      return readTimeline(transaction, context, studentId);
    };

    return UnitOfWork.isTransactionActive()
      ? executeRead()
      : UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'Canonical Student Timeline Read',
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: 'server',
          affectedTables: ['audit_events']
        },
        executeRead,
        context
      );
  }
}

export type ExamReadinessStatus = 'success' | 'warning';

export type ExamReadinessCheck = {
  id: number | string;
  name: string;
  status: ExamReadinessStatus;
  desc: string;
};

type ExamDatabaseSyncStatus = 'idle' | 'success' | 'conflict' | 'rejected' | 'error';

export const includeCentralSourceCheck = (
  checks: ExamReadinessCheck[],
  syncStatus: ExamDatabaseSyncStatus,
): ExamReadinessCheck[] => {
  const status = syncStatus === 'success' ? 'success' : 'warning';
  const desc = syncStatus === 'success'
    ? 'اتصال المصدر المركزي مؤكد في آخر مزامنة.'
    : syncStatus === 'conflict'
      ? 'يوجد تعارض إصدار؛ أعد المزامنة قبل اعتبار الجاهزية.'
      : syncStatus === 'rejected'
        ? 'رفض المصدر البيانات؛ راجع التحقق قبل اعتبار الجاهزية.'
        : syncStatus === 'error'
          ? 'تعذر الاتصال بالمصدر المركزي؛ لا يمكن تأكيد الجاهزية.'
          : 'لم يكتمل التحقق من اتصال المصدر المركزي.';

  return [
    { id: 'central-source', name: 'اتصال المصدر المركزي', status, desc },
    ...checks,
  ];
};

export const areExamReadinessChecksPassing = (checks: ExamReadinessCheck[]): boolean =>
  checks.length > 0 && checks.every(check => check.status === 'success');

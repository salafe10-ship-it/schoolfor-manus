export type RecruitmentStatus =
  | 'submitted'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'converted';

export interface RecruitmentApplication {
  id: string;
  applicantName: string;
  phone: string;
  email: string;
  jobId: string;
  departmentId: string;
  submittedAt: string;
  status: RecruitmentStatus;
  notes?: string;
  convertedEmployeeId?: string;
  auditLog: Array<{ action: string; at: string; actor: string; details: string }>;
}

const transitions: Record<RecruitmentStatus, RecruitmentStatus[]> = {
  submitted: ['screening', 'rejected', 'withdrawn'],
  screening: ['interview', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['approved', 'rejected', 'withdrawn'],
  approved: ['converted'],
  rejected: [],
  withdrawn: [],
  converted: []
};

export function canMoveRecruitmentStatus(from: RecruitmentStatus, to: RecruitmentStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function moveRecruitmentStatus(
  application: RecruitmentApplication,
  nextStatus: RecruitmentStatus,
  actor: string,
  at: string,
  details = ''
): RecruitmentApplication {
  if (!canMoveRecruitmentStatus(application.status, nextStatus)) {
    throw new Error(`لا يمكن نقل طلب التوظيف ${application.id} من ${application.status} إلى ${nextStatus}.`);
  }
  if (!actor.trim()) throw new Error('لا يمكن تسجيل انتقال التوظيف دون مستخدم منفذ.');
  if (!at.trim()) throw new Error('لا يمكن تسجيل انتقال التوظيف دون وقت موثق.');
  if (nextStatus === 'converted' && !application.convertedEmployeeId) {
    throw new Error('لا يمكن إغلاق الطلب كموظف محوّل قبل ربط رقم الموظف الحقيقي.');
  }
  return {
    ...application,
    status: nextStatus,
    auditLog: [...application.auditLog, { action: `status:${nextStatus}`, at, actor, details }]
  };
}

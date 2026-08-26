export type ExamClosureBlockerCode =
  | 'missing_students'
  | 'missing_subjects'
  | 'schedule_not_approved'
  | 'student_assignment_incomplete'
  | 'duplicate_seat_number'
  | 'missing_grades'
  | 'subjects_not_reviewed'
  | 'open_appeals';

export interface ExamClosureBlocker {
  code: ExamClosureBlockerCode;
  message: string;
  count: number;
}

export interface ExamClosureReadinessInput {
  students: Array<{
    id?: unknown;
    name?: unknown;
    hallId?: unknown;
    seatNumber?: unknown;
    absentSubjects?: unknown;
  }>;
  subjects: Array<{ id?: unknown; name?: unknown }>;
  gradesMatrix: Record<string, Record<string, unknown>>;
  scheduleApprovalStatus?: { approved?: unknown } | null;
  reviewedSubjects?: Record<string, unknown> | unknown[] | null;
  reEvaluationRequests?: Array<{ status?: unknown }> | null;
}

export interface ExamClosureReadinessReport {
  ready: boolean;
  blockers: ExamClosureBlocker[];
  missingGradesCount: number;
  unassignedStudentsCount: number;
  duplicateSeatNumbersCount: number;
  unreviewedSubjectsCount: number;
  openAppealsCount: number;
}

const text = (value: unknown): string => String(value ?? '').trim();

const isSubjectReviewed = (reviewed: ExamClosureReadinessInput['reviewedSubjects'], subjectId: string): boolean => {
  if (Array.isArray(reviewed)) return reviewed.some(value => text(value) === subjectId);
  if (!reviewed || typeof reviewed !== 'object') return false;
  return Object.entries(reviewed).some(([key, value]) => Boolean(value) && (key === subjectId || key.endsWith(`-${subjectId}`)));
};

const isAppealOpen = (status: unknown): boolean => {
  const normalized = text(status).toLowerCase();
  return !['completed', 'resolved', 'rejected', 'cancelled', 'closed', 'مكتمل', 'مرفوض', 'ملغي', 'مغلق'].includes(normalized);
};

/**
 * Central pre-approval gate used by both the API and the UI. It intentionally
 * returns every blocker so the operator can fix the whole cycle in one pass.
 */
export function evaluateExamClosureReadiness(input: ExamClosureReadinessInput): ExamClosureReadinessReport {
  const students = Array.isArray(input.students) ? input.students : [];
  const subjects = Array.isArray(input.subjects) ? input.subjects : [];
  const gradesMatrix = input.gradesMatrix && typeof input.gradesMatrix === 'object' ? input.gradesMatrix : {};
  const blockers: ExamClosureBlocker[] = [];

  if (students.length === 0) {
    blockers.push({ code: 'missing_students', count: 1, message: 'لا يمكن إغلاق دورة امتحانات بلا طلاب موثقين.' });
  }
  if (subjects.length === 0) {
    blockers.push({ code: 'missing_subjects', count: 1, message: 'لا يمكن إغلاق دورة امتحانات بلا مواد موثقة.' });
  }
  if (input.scheduleApprovalStatus?.approved !== true) {
    blockers.push({ code: 'schedule_not_approved', count: 1, message: 'يجب اعتماد جدول الامتحانات على الخادم قبل اعتماد النتائج.' });
  }

  const unassignedStudents = students.filter(student => !text(student.hallId) || !text(student.seatNumber));
  if (unassignedStudents.length > 0) {
    blockers.push({
      code: 'student_assignment_incomplete',
      count: unassignedStudents.length,
      message: `يوجد ${unassignedStudents.length} طالب دون قاعة أو رقم جلوس مكتمل.`
    });
  }

  const seatCounts = new Map<string, number>();
  students.forEach(student => {
    const seatNumber = text(student.seatNumber);
    if (seatNumber) seatCounts.set(seatNumber, (seatCounts.get(seatNumber) || 0) + 1);
  });
  const duplicateSeatNumbersCount = [...seatCounts.values()].filter(count => count > 1).length;
  if (duplicateSeatNumbersCount > 0) {
    blockers.push({
      code: 'duplicate_seat_number',
      count: duplicateSeatNumbersCount,
      message: `يوجد ${duplicateSeatNumbersCount} رقم جلوس مكرر على مستوى الدورة.`
    });
  }

  let missingGradesCount = 0;
  for (const student of students) {
    const studentId = text(student.id);
    const absentSubjects = new Set(Array.isArray(student.absentSubjects) ? student.absentSubjects.map(text) : []);
    for (const subject of subjects) {
      const subjectId = text(subject.id);
      if (!studentId || !subjectId || absentSubjects.has(subjectId)) continue;
      if (!Number.isFinite(gradesMatrix[studentId]?.[subjectId])) missingGradesCount += 1;
    }
  }
  if (missingGradesCount > 0) {
    blockers.push({
      code: 'missing_grades',
      count: missingGradesCount,
      message: `توجد ${missingGradesCount} درجة غير مرصودة أو غير مصنفة كغياب.`
    });
  }

  const unreviewedSubjectsCount = subjects.filter(subject => {
    const subjectId = text(subject.id);
    return subjectId && !isSubjectReviewed(input.reviewedSubjects, subjectId);
  }).length;
  if (unreviewedSubjectsCount > 0) {
    blockers.push({
      code: 'subjects_not_reviewed',
      count: unreviewedSubjectsCount,
      message: `توجد ${unreviewedSubjectsCount} مادة لم تُوقّع مراجعتها قبل الإغلاق.`
    });
  }

  const openAppealsCount = (Array.isArray(input.reEvaluationRequests) ? input.reEvaluationRequests : [])
    .filter(request => isAppealOpen(request?.status)).length;
  if (openAppealsCount > 0) {
    blockers.push({
      code: 'open_appeals',
      count: openAppealsCount,
      message: `توجد ${openAppealsCount} حالة تظلم أو إعادة تقييم مفتوحة.`
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
    missingGradesCount,
    unassignedStudentsCount: unassignedStudents.length,
    duplicateSeatNumbersCount,
    unreviewedSubjectsCount,
    openAppealsCount
  };
}

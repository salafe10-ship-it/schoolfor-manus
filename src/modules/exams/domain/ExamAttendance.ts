export type ExamAttendanceStatus = 'present' | 'absent';
export type ExamAttendanceMap = Record<string, ExamAttendanceStatus>;

export interface ExamAttendanceStudent {
  examAttendance?: unknown;
  absentSubjects?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Normalizes persisted attendance while preserving legacy, explicitly absent
 * subject records. A missing status is deliberately not treated as present.
 */
export function normalizeExamAttendance<T extends ExamAttendanceStudent>(student: T): T & {
  examAttendance: ExamAttendanceMap;
  absentSubjects: string[];
} {
  const attendance: ExamAttendanceMap = {};
  if (isRecord(student.examAttendance)) {
    Object.entries(student.examAttendance).forEach(([subjectId, status]) => {
      if (subjectId && (status === 'present' || status === 'absent')) attendance[subjectId] = status;
    });
  }

  const legacyAbsences = Array.isArray(student.absentSubjects)
    ? student.absentSubjects.map(value => String(value ?? '').trim()).filter(Boolean)
    : [];
  legacyAbsences.forEach(subjectId => {
    if (!attendance[subjectId]) attendance[subjectId] = 'absent';
  });

  const absentSubjects = Object.entries(attendance)
    .filter(([, status]) => status === 'absent')
    .map(([subjectId]) => subjectId);

  return { ...student, examAttendance: attendance, absentSubjects };
}

export function getExamAttendanceStatus(
  student: ExamAttendanceStudent,
  subjectId: string
): ExamAttendanceStatus | null {
  const rawStatus = isRecord(student.examAttendance) ? student.examAttendance[subjectId] : undefined;
  if (rawStatus === 'present' || rawStatus === 'absent') return rawStatus;
  if (Array.isArray(student.absentSubjects) && student.absentSubjects.some(value => String(value ?? '').trim() === subjectId)) {
    return 'absent';
  }
  return null;
}

export function withExamAttendance<T extends ExamAttendanceStudent>(
  student: T,
  subjectId: string,
  status: ExamAttendanceStatus | null
): T & { examAttendance: ExamAttendanceMap; absentSubjects: string[] } {
  const normalized = normalizeExamAttendance(student);
  const attendance = { ...normalized.examAttendance };
  if (status) attendance[subjectId] = status;
  else delete attendance[subjectId];

  const absentSubjects = Object.entries(attendance)
    .filter(([, nextStatus]) => nextStatus === 'absent')
    .map(([id]) => id);
  return normalizeExamAttendance({ ...normalized, examAttendance: attendance, absentSubjects });
}

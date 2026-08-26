export type ExamResultStatus = 'passed' | 'failed' | 'incomplete';

export type ExamRoundingPolicy =
  | 'التقريب لأقرب نصف درجة'
  | 'جبر الكسور لأقرب عدد صحيح'
  | 'إلغاء الكسور واحتساب العدد الصحيح الأدنى';

export interface ExamResultSettings {
  roundingPolicy?: string;
  passMarkPercent?: number;
  minFinalMarkPercent?: number;
}

export interface ExamResultSubject {
  id: string;
  name: string;
  maxScore: number;
  passScore: number;
  isCore?: boolean;
}

export interface ExamResultStudent {
  id: string;
  absentSubjects?: string[];
}

export interface FailedExamSubject {
  subjectId: string;
  subjectName: string;
  reason: 'absent' | 'below_subject_pass_mark' | 'below_final_exam_minimum';
  mark: number;
  maxScore: number;
}

export interface CalculatedExamResult {
  studentId: string;
  totalEarned: number;
  totalMax: number;
  rawPercentage: number;
  percentage: number;
  gradeSymbol: string;
  status: ExamResultStatus;
  incompleteSubjectsCount: number;
  failedSubjectsCount: number;
  failedSubjects: FailedExamSubject[];
  hasFailedCoreSubject: boolean;
  rank: number | null;
}

const finitePercentage = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallback;
};

export function applyExamRoundingPolicy(value: number, policy?: string): number {
  if (!Number.isFinite(value)) return 0;
  if (policy === 'التقريب لأقرب نصف درجة') return Math.round(value * 2) / 2;
  if (policy === 'جبر الكسور لأقرب عدد صحيح') return Math.ceil(value);
  if (policy === 'إلغاء الكسور واحتساب العدد الصحيح الأدنى') return Math.floor(value);
  return Math.round(value * 10) / 10;
}

export function resolveExamGradeSymbol(percentage: number, status: ExamResultStatus): string {
  if (status === 'incomplete') return 'غير مكتمل';
  if (percentage >= 90) return 'ممتاز';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 65) return 'جيد';
  if (percentage >= 50) return 'مقبول';
  return 'ضعيف';
}

export function calculateStudentExamResult(
  student: ExamResultStudent,
  subjects: ExamResultSubject[],
  gradesMatrix: Record<string, Record<string, number>>,
  settings: ExamResultSettings
): CalculatedExamResult {
  const passMarkPercent = finitePercentage(settings.passMarkPercent, 50);
  const minFinalMarkPercent = finitePercentage(settings.minFinalMarkPercent, 0);
  const absentSubjects = new Set(Array.isArray(student.absentSubjects) ? student.absentSubjects : []);
  const studentGrades = gradesMatrix[student.id] || {};
  const failedSubjects: FailedExamSubject[] = [];
  let totalEarned = 0;
  let totalMax = 0;
  let incompleteSubjectsCount = 0;
  let hasFailedCoreSubject = false;

  for (const subject of subjects) {
    const maxScore = Number(subject.maxScore);
    const passScore = Number(subject.passScore);
    if (!Number.isFinite(maxScore) || maxScore <= 0) continue;
    totalMax += maxScore;

    const isAbsent = absentSubjects.has(subject.id);
    const rawMark = studentGrades[subject.id];
    const hasRecordedMark = typeof rawMark === 'number' && Number.isFinite(rawMark);
    if (!hasRecordedMark && !isAbsent) {
      incompleteSubjectsCount += 1;
      continue;
    }

    const mark = isAbsent ? 0 : rawMark;
    totalEarned += mark;
    const finalExamPercentage = (mark / maxScore) * 100;
    let reason: FailedExamSubject['reason'] | null = null;
    if (isAbsent) reason = 'absent';
    else if (mark < passScore) reason = 'below_subject_pass_mark';
    else if (finalExamPercentage < minFinalMarkPercent) reason = 'below_final_exam_minimum';

    if (reason) {
      failedSubjects.push({
        subjectId: subject.id,
        subjectName: subject.name,
        reason,
        mark,
        maxScore
      });
      if (subject.isCore === true) hasFailedCoreSubject = true;
    }
  }

  const rawPercentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const percentage = applyExamRoundingPolicy(rawPercentage, settings.roundingPolicy);
  const status: ExamResultStatus = incompleteSubjectsCount > 0 || subjects.length === 0
    ? 'incomplete'
    : failedSubjects.length > 0 || percentage < passMarkPercent
      ? 'failed'
      : 'passed';

  return {
    studentId: student.id,
    totalEarned,
    totalMax,
    rawPercentage: Math.round(rawPercentage * 10_000) / 10_000,
    percentage,
    gradeSymbol: resolveExamGradeSymbol(percentage, status),
    status,
    incompleteSubjectsCount,
    failedSubjectsCount: failedSubjects.length,
    failedSubjects,
    hasFailedCoreSubject,
    rank: null
  };
}

export function calculateCohortExamResults(
  students: ExamResultStudent[],
  subjects: ExamResultSubject[],
  gradesMatrix: Record<string, Record<string, number>>,
  settings: ExamResultSettings
): CalculatedExamResult[] {
  const calculated = students.map(student => calculateStudentExamResult(student, subjects, gradesMatrix, settings));
  const completed = calculated
    .filter(result => result.status !== 'incomplete')
    .sort((left, right) => right.percentage - left.percentage || right.totalEarned - left.totalEarned || left.studentId.localeCompare(right.studentId));

  let previousPercentage: number | null = null;
  let previousTotal: number | null = null;
  let previousRank = 0;
  completed.forEach((result, index) => {
    const isTie = previousPercentage === result.percentage && previousTotal === result.totalEarned;
    result.rank = isTie ? previousRank : index + 1;
    previousPercentage = result.percentage;
    previousTotal = result.totalEarned;
    previousRank = result.rank;
  });

  const byStudent = new Map(calculated.map(result => [result.studentId, result]));
  return [...calculated].sort((left, right) => {
    const leftResult = byStudent.get(left.studentId)!;
    const rightResult = byStudent.get(right.studentId)!;
    if (leftResult.rank === null && rightResult.rank === null) return left.studentId.localeCompare(right.studentId);
    if (leftResult.rank === null) return 1;
    if (rightResult.rank === null) return -1;
    return leftResult.rank - rightResult.rank || left.studentId.localeCompare(right.studentId);
  });
}

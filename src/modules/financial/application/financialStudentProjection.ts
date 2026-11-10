const FINANCIAL_STUDENT_FIELDS = [
  'id',
  'schoolId',
  'branchId',
  'name',
  'parentName',
  'studentNumber',
  'studentCode',
  'stageId',
  'gradeId',
  'classroom',
  'section',
  'academicYearId',
  'academicYear',
  'status',
  'feesPaid',
  'feesRemaining',
  'isDeleted',
] as const;

/** Keep finance-only student lookup responses limited to fields used by fee workflows. */
export function projectFinancialStudent<T extends Record<string, unknown>>(student: T): Partial<T> {
  const projected: Partial<T> = {};
  for (const field of FINANCIAL_STUDENT_FIELDS) {
    if (field in student) projected[field as keyof T] = student[field as keyof T];
  }
  return projected;
}

export function projectFinancialStudents<T extends Record<string, unknown>>(students: T[]): Partial<T>[] {
  return students.map(projectFinancialStudent);
}

type AcademicRecord = Record<string, unknown>;

const text = (value: unknown): string => String(value ?? '').trim();

/** Resolve a student's placement from the canonical class → grade → stage chain. */
export function resolveStudentAcademicContext(
  student: AcademicRecord,
  classes: AcademicRecord[],
  grades: AcademicRecord[]
) {
  const classId = text(student.classId);
  const classroom = text(student.classroom);
  const byIdentifier = (value: string) => value
    ? classes.find(record => [text(record.id), text(record.code), text(record.name)].includes(value))
    : undefined;
  const classRecord = byIdentifier(classId) || byIdentifier(classroom);

  // A resolved class is authoritative: its grade wins over stale denormalized
  // student.gradeId/grade fields. Fall back only when the catalog is incomplete.
  const gradeId = text(classRecord?.gradeId) || text(student.gradeId);
  const rawGrade = text(student.grade);
  const gradeRecord = (gradeId
    ? grades.find(record => text(record.id) === gradeId)
    : undefined) || (rawGrade
      ? grades.find(record => text(record.name) === rawGrade || text(record.code) === rawGrade)
      : undefined);

  return {
    classRecord,
    gradeRecord,
    stageId: text(gradeRecord?.stageId) || text(student.stageId),
    gradeId: text(gradeRecord?.id) || gradeId,
    classId: text(classRecord?.id) || classId,
    classroom,
    classCode: text(classRecord?.code),
    className: text(classRecord?.name),
    section: text(student.section)
  };
}

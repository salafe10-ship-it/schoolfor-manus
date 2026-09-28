export interface ExamTeacherGradeScope {
  id: string;
  employeeId: string;
  subjectId: string;
  classroom: string;
  section: string;
}

export interface ExamGradeHistoryActor {
  employeeId: string;
  name: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const asList = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.map(asRecord) : [];

const stableValue = (value: unknown): string => {
  if (value === undefined) return '__undefined__';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableValue(record[key])}`).join(',')}}`;
};

export function hasExamGradeMatrixChanges(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>
): boolean {
  const currentMatrix = asRecord(currentData.exams_grades_matrix);
  const requestedMatrix = asRecord(requestedData.exams_grades_matrix);
  for (const studentId of Object.keys(requestedMatrix)) {
    const currentGrades = asRecord(currentMatrix[studentId]);
    const requestedGrades = asRecord(requestedMatrix[studentId]);
    for (const subjectId of Object.keys(requestedGrades)) {
      if (stableValue(currentGrades[subjectId]) !== stableValue(requestedGrades[subjectId])) return true;
    }
  }
  return false;
}

export function mergeTeacherGradeMatrixPatch(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>
): Record<string, Record<string, unknown>> {
  const currentMatrix = asRecord(currentData.exams_grades_matrix);
  const requestedMatrix = asRecord(requestedData.exams_grades_matrix);
  const merged: Record<string, Record<string, unknown>> = Object.fromEntries(
    Object.entries(currentMatrix).map(([studentId, grades]) => [studentId, { ...asRecord(grades) }])
  );

  Object.entries(requestedMatrix).forEach(([studentId, rawGrades]) => {
    const grades = asRecord(rawGrades);
    if (!merged[studentId]) merged[studentId] = {};
    Object.entries(grades).forEach(([subjectId, grade]) => {
      // An explicit null is a tombstone for clearing one assigned grade.
      // Omitted students/subjects mean “not part of this patch”.
      if (grade === null) delete merged[studentId][subjectId];
      else merged[studentId][subjectId] = grade;
    });
    if (Object.keys(merged[studentId]).length === 0) delete merged[studentId];
  });

  return merged;
}

/**
 * Build audit entries on the trusted server from canonical student/subject
 * labels and the submitted cell patch. Never trust client-supplied history.
 */
export function buildTeacherGradeHistoryEntries(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>,
  actor: ExamGradeHistoryActor,
  options: { timestamp?: string; createId: () => string }
): Array<Record<string, unknown>> {
  const currentMatrix = asRecord(currentData.exams_grades_matrix);
  const requestedMatrix = asRecord(requestedData.exams_grades_matrix);
  const students = new Map(asList(currentData.exams_students_enriched)
    .map(student => [String(student.id ?? '').trim(), student] as const));
  const subjects = new Map(asList(currentData.exams_subjects)
    .map(subject => [String(subject.id ?? '').trim(), subject] as const));
  const modifiedBy = String(actor.name ?? '').trim() || String(actor.employeeId ?? '').trim() || 'موظف موثق';
  const timestamp = options.timestamp || new Date().toISOString();
  const entries: Array<Record<string, unknown>> = [];

  Object.entries(requestedMatrix).forEach(([studentId, rawGrades]) => {
    const requestedGrades = asRecord(rawGrades);
    const oldGrades = asRecord(currentMatrix[studentId]);
    Object.entries(requestedGrades).forEach(([subjectId, requestedGrade]) => {
      const oldGrade = oldGrades[subjectId];
      const newGrade = requestedGrade === null ? undefined : requestedGrade;
      // A tombstone for a cell that is already empty is not an audit event.
      if (stableValue(oldGrade) === stableValue(newGrade)) return;
      const student = students.get(studentId);
      const subject = subjects.get(subjectId);
      entries.push({
        id: options.createId(),
        studentName: String(student?.name ?? studentId),
        classroom: String(student?.classroom ?? ''),
        subjectName: String(subject?.name ?? subjectId),
        oldGrade: oldGrade === undefined ? null : oldGrade,
        newGrade: newGrade === undefined ? null : newGrade,
        modifiedBy,
        employeeId: String(actor.employeeId ?? '').trim(),
        reason: 'تعديل رصد الدرجة ضمن نطاق تصحيح موثق',
        source: 'teacher_scoped_entry',
        timestamp
      });
    });
  });
  return entries;
}

export function hasExamStudentAttendanceChanges(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>
): boolean {
  const currentStudents = new Map(asList(currentData.exams_students_enriched)
    .map(student => [String(student.id ?? '').trim(), student] as const));
  for (const patch of asList(requestedData.exams_students_enriched)) {
    const current = currentStudents.get(String(patch.id ?? '').trim());
    const currentAttendance = asRecord(current?.examAttendance);
    const requestedAttendance = asRecord(patch.examAttendance);
    for (const subjectId of Object.keys(requestedAttendance)) {
      if (stableValue(currentAttendance[subjectId]) !== stableValue(requestedAttendance[subjectId])) return true;
    }
  }
  return false;
}

export function assertTeacherStudentAttendanceScope(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>,
  employeeId: unknown
): void {
  if (requestedData.exams_students_enriched === undefined) return;
  if (!Array.isArray(requestedData.exams_students_enriched)) {
    throw new Error('تغييرات حضور الطلاب يجب أن تكون قائمة صالحة.');
  }
  const actorEmployeeId = String(employeeId ?? '').trim();
  const students = new Map(asList(currentData.exams_students_enriched)
    .map(student => [String(student.id ?? '').trim(), student] as const));
  const scopes = asList(currentData.exams_teacher_grade_scopes);

  asList(requestedData.exams_students_enriched).forEach(patch => {
    const studentId = String(patch.id ?? '').trim();
    const student = students.get(studentId);
    if (!studentId || !student) throw new Error('لا يمكن تسجيل حضور طالب خارج السجل الأكاديمي الحالي.');
    const unsupportedFields = Object.keys(patch).filter(key => !['id', 'examAttendance'].includes(key));
    if (unsupportedFields.length) throw new Error('يمكن للمعلم تعديل حالة الحضور فقط، وليس بيانات الطالب أو توزيعه.');
    const attendance = asRecord(patch.examAttendance);
    Object.entries(attendance).forEach(([subjectId, status]) => {
      if (status !== null && status !== 'present' && status !== 'absent') {
        throw new Error('حالة حضور الامتحان غير صالحة.');
      }
      const isAssigned = Boolean(actorEmployeeId) && scopes.some(scope =>
        String(scope.employeeId ?? '').trim() === actorEmployeeId
        && String(scope.subjectId ?? '').trim() === subjectId
        && String(scope.classroom ?? '').trim() === String(student.classroom ?? '').trim()
        && String(scope.section ?? '').trim() === String(student.section ?? '').trim()
      );
      if (!isAssigned) throw new Error('لا يملك هذا المعلم نطاق حضور موثقاً لهذه المادة والصف والشعبة.');
    });
  });
}

export function mergeTeacherStudentAttendancePatch(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>
): Array<Record<string, unknown>> {
  const currentStudents = asList(currentData.exams_students_enriched).map(student => ({
    ...student,
    examAttendance: { ...asRecord(student.examAttendance) }
  }));
  const studentsById = new Map(currentStudents.map(student => [String(student['id'] ?? '').trim(), student] as const));
  asList(requestedData.exams_students_enriched).forEach(patch => {
    const student = studentsById.get(String(patch.id ?? '').trim());
    if (!student) return;
    const attendance = asRecord(student['examAttendance']);
    Object.entries(asRecord(patch.examAttendance)).forEach(([subjectId, status]) => {
      if (status === null) delete attendance[subjectId];
      else attendance[subjectId] = status;
    });
    student['examAttendance'] = attendance;
    student['absentSubjects'] = Object.entries(attendance)
      .filter(([, status]) => status === 'absent')
      .map(([subjectId]) => subjectId);
  });
  return currentStudents;
}

export function assertTeacherGradeMatrixScope(
  currentData: Record<string, unknown>,
  requestedData: Record<string, unknown>,
  employeeId: unknown
): void {
  if (!hasExamGradeMatrixChanges(currentData, requestedData)) return;
  const actorEmployeeId = String(employeeId ?? '').trim();
  const currentMatrix = asRecord(currentData.exams_grades_matrix);
  const requestedMatrix = asRecord(requestedData.exams_grades_matrix);
  const studentById = new Map<string, Record<string, unknown>>();
  asList(currentData.exams_students_enriched).forEach(student => {
    const id = String(student.id ?? '').trim();
    if (id) studentById.set(id, student);
  });
  const scopes = asList(currentData.exams_teacher_grade_scopes);
  for (const studentId of Object.keys(requestedMatrix)) {
    const currentGrades = asRecord(currentMatrix[studentId]);
    const requestedGrades = asRecord(requestedMatrix[studentId]);
    for (const subjectId of Object.keys(requestedGrades)) {
      if (stableValue(currentGrades[subjectId]) === stableValue(requestedGrades[subjectId])) continue;
      const student = studentById.get(studentId);
      const isAssigned = Boolean(actorEmployeeId && student) && scopes.some(scope =>
        String(scope.employeeId ?? '').trim() === actorEmployeeId
        && String(scope.subjectId ?? '').trim() === subjectId
        && String(scope.classroom ?? '').trim() === String(student?.classroom ?? '').trim()
        && String(scope.section ?? '').trim() === String(student?.section ?? '').trim()
      );
      if (!isAssigned) {
        throw new Error('لا يملك هذا المعلم نطاق تصحيح موثقاً لهذه المادة والصف والشعبة.');
      }
    }
  }
}

export function validateTeacherGradeScopes(
  rawScopes: unknown,
  employeeIds: Iterable<string>,
  subjectIds: Iterable<string>,
  classrooms: Array<{ name: string; sections?: unknown }>
): void {
  if (!Array.isArray(rawScopes)) throw new Error('نطاقات تصحيح المعلمين يجب أن تكون قائمة صالحة.');
  const employees = new Set(Array.from(employeeIds, id => String(id).trim()).filter(Boolean));
  const subjects = new Set(Array.from(subjectIds, id => String(id).trim()).filter(Boolean));
  const classes = new Map<string, Set<string>>(classrooms.map(item => [String(item.name).trim(), new Set(
    Array.isArray(item.sections) ? item.sections.map(section => String(section).trim()).filter(Boolean) : []
  )] as const));
  const scopeIds = new Set<string>();
  const scopeKeys = new Set<string>();

  rawScopes.forEach((rawScope, index) => {
    const scope = asRecord(rawScope);
    const id = String(scope.id ?? '').trim();
    const employeeId = String(scope.employeeId ?? '').trim();
    const subjectId = String(scope.subjectId ?? '').trim();
    const classroom = String(scope.classroom ?? '').trim();
    const section = String(scope.section ?? '').trim();
    const classSections = classes.get(classroom);
    if (!id || !employeeId || !subjectId || !classroom || !section) {
      throw new Error(`نطاق تصحيح المعلم رقم ${index + 1} يحتوي بيانات ناقصة.`);
    }
    if (!employees.has(employeeId)) throw new Error(`الموظف ${employeeId} غير نشط أو غير مرتبط بسجل المدرسة الرسمي.`);
    if (!subjects.has(subjectId)) throw new Error(`المادة ${subjectId} غير موجودة في دورة الامتحانات.`);
    if (!classSections || !classSections.has(section)) throw new Error(`الصف أو الشعبة ${classroom} / ${section} غير موجودين في الهيكل الحالي.`);
    if (scopeIds.has(id)) throw new Error(`معرف نطاق التصحيح ${id} مكرر.`);
    scopeIds.add(id);
    const scopeKey = `${employeeId}\u0000${subjectId}\u0000${classroom}\u0000${section}`;
    if (scopeKeys.has(scopeKey)) throw new Error('نطاق تصحيح المعلم مكرر للمادة والصف والشعبة نفسها.');
    scopeKeys.add(scopeKey);
  });
}

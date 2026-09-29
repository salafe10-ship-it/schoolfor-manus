import { describe, expect, it } from 'vitest';
import { ExamValidator } from '../validation/validators';
import { reconcileExamDatabaseClassReferences } from '../modules/exams/application/CanonicalExamClassSyncService';

const validDatabase = () => ({
  exams_settings: { academicYear: '2026/2027' },
  exams_subjects: [{ id: 'subject-1', name: 'اللغة العربية', maxScore: 100, passScore: 50 }],
  exams_halls: [{ id: 'hall-1', name: 'القاعة الرئيسية', capacity: 30, status: 'active' }],
  exams_students_enriched: [{ id: 'student-1', name: 'طالب موثق', classroom: 'الصف الأول', academicYear: '2026/2027', status: 'active', absentSubjects: [] }],
  exams_grades_matrix: { 'student-1': { 'subject-1': 75 } },
  exams_schedule: [],
  exams_proctors: [],
  exams_classes_list: [{ id: 'class-1', name: 'الصف الأول', capacity: 30 }]
});

describe('exams database validation', () => {
  it('accepts a valid canonical draft', () => {
    expect(() => ExamValidator.validateDatabase(validDatabase())).not.toThrow();
  });

  it('accepts an active student whose canonical class reference is an id after reconciliation', () => {
    const database: any = validDatabase();
    database.exams_students_enriched[0].classroom = 'kg-1';
    database.exams_classes_list = [];

    reconcileExamDatabaseClassReferences(database, {
      sections: ['أ'],
      classes: [
        { id: 'kg-1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true }
      ]
    }, ['kg-1']);

    expect(database.exams_students_enriched[0].classroom).toBe('بستان أ');
    expect(() => ExamValidator.validateDatabase(database)).not.toThrow();
  });

  it('rejects grades outside the subject range', () => {
    const database = validDatabase();
    database.exams_grades_matrix['student-1']['subject-1'] = 101;
    expect(() => ExamValidator.validateDatabase(database)).toThrow(/خارج النطاق/);
  });

  it('validates explicit exam attendance statuses and absence-index consistency', () => {
    const database: any = validDatabase();
    database.exams_students_enriched[0].examAttendance = { 'subject-1': 'present' };
    expect(() => ExamValidator.validateDatabase(database)).not.toThrow();

    database.exams_students_enriched[0].examAttendance['subject-1'] = 'unknown';
    expect(() => ExamValidator.validateDatabase(database)).toThrow(/سجل حضور الطالب.*غير صالح/);

    database.exams_students_enriched[0].examAttendance['subject-1'] = 'absent';
    expect(() => ExamValidator.validateDatabase(database)).toThrow(/سجل الغياب.*غير متطابق/);
  });

  it('rejects a grade row for an unknown student', () => {
    const database: any = validDatabase();
    database.exams_grades_matrix['unknown-student'] = { 'subject-1': 70 };
    expect(() => ExamValidator.validateDatabase(database)).toThrow(/طالباً غير صالح/);
  });

  it('rejects duplicate subject names even when whitespace differs', () => {
    const database: any = validDatabase();
    database.exams_subjects.push({ id: 'subject-2', name: '  اللغة   العربية ', maxScore: 100, passScore: 50 });
    expect(() => ExamValidator.validateDatabase(database)).toThrow(/اسم المادة.*مكرر/);
  });

  it('rejects duplicate seats and incomplete hall assignments', () => {
    const database: any = validDatabase();
    database.exams_students_enriched = [
      { ...database.exams_students_enriched[0], hallId: 'hall-1', seatNumber: '1001' },
      { id: 'student-2', name: 'طالب ثان', classroom: 'الصف الأول', academicYear: '2026/2027', status: 'accepted', absentSubjects: [], hallId: 'hall-1', seatNumber: '1001' }
    ];
    database.exams_grades_matrix['student-2'] = { 'subject-1': 80 };
    expect(() => ExamValidator.validateDatabase(database)).toThrow(/رقم الجلوس.*مكرر/);
  });
});

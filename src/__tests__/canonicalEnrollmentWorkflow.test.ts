import { describe, expect, it } from 'vitest';
import {
  normalizeEnrollmentOperation,
  resolveTargetEnrollmentClass,
  type AcademicEnrollmentClass
} from '../modules/student-affairs/application/CanonicalEnrollmentWorkflowService';

const classes: AcademicEnrollmentClass[] = [
  { id: 'class-a', code: 'GRADE-1-A', name: 'الصف الأول أ', gradeId: 'grade-1', capacity: 30, isActive: true },
  { id: 'class-b', code: 'GRADE-1-B', name: 'الصف الأول ب', gradeId: 'grade-1', capacity: 30, isActive: true },
  { id: 'class-old', code: 'GRADE-2-A', name: 'الصف الثاني أ', gradeId: 'grade-2', capacity: 30, isActive: false }
];

describe('canonical enrollment workflow contract', () => {
  it('accepts only canonical workflow operations', () => {
    expect(normalizeEnrollmentOperation('transfer')).toBe('transfer');
    expect(normalizeEnrollmentOperation('promote')).toBe('promote');
    expect(() => normalizeEnrollmentOperation('delete')).toThrow();
  });

  it('resolves an active class by trusted grade and section', () => {
    expect(resolveTargetEnrollmentClass(classes, new Set(['أ', 'ب']), '', 'grade-1', 'ب').id).toBe('class-b');
    expect(() => resolveTargetEnrollmentClass(classes, new Set(['أ']), 'class-b', 'grade-1', 'ب')).toThrow();
    expect(() => resolveTargetEnrollmentClass(classes, new Set(['أ', 'ب']), '', 'grade-2', 'أ')).toThrow();
  });
});

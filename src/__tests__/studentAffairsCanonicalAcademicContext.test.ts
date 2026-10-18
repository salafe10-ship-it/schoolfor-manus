import { describe, expect, it } from 'vitest';
import { resolveStudentAcademicContext } from '../components/student-affairs/academicContext';

describe('Student Affairs canonical academic context', () => {
  const classes = [{ id: 'class-high-a', code: 'H-A', name: 'أولى ثانوي علمي أ', gradeId: 'grade-high' }];
  const grades = [{ id: 'grade-high', name: 'الصف الأول الثانوي', stageId: 'stage-secondary' }];

  it('derives grade and stage from the canonical class instead of stale student fields', () => {
    const context = resolveStudentAcademicContext({
      classId: 'class-high-a',
      classroom: 'أولى ثانوي علمي أ',
      gradeId: 'grade-kindergarten',
      grade: 'تمهيدي',
      stageId: 'stage-kindergarten',
      section: '1'
    }, classes, grades);

    expect(context.gradeId).toBe('grade-high');
    expect(context.gradeRecord?.name).toBe('الصف الأول الثانوي');
    expect(context.stageId).toBe('stage-secondary');
    expect(context.className).toBe('أولى ثانوي علمي أ');
  });

  it('falls back to stored placement identifiers when no canonical class is available', () => {
    const context = resolveStudentAcademicContext({ classId: 'missing-class', gradeId: 'grade-high', stageId: 'legacy-stage' }, [], grades);

    expect(context.classId).toBe('missing-class');
    expect(context.gradeId).toBe('grade-high');
    expect(context.stageId).toBe('stage-secondary');
  });

  it('recovers a canonical class by its displayed name when the stored class ID is stale', () => {
    const context = resolveStudentAcademicContext({ classId: 'retired-class-id', classroom: 'أولى ثانوي علمي أ' }, classes, grades);

    expect(context.classId).toBe('class-high-a');
    expect(context.gradeId).toBe('grade-high');
    expect(context.stageId).toBe('stage-secondary');
  });
});

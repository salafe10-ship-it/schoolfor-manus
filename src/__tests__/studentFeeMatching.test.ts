import { describe, expect, it } from 'vitest';
import { feeConfigMatchesStudent, resolveStudentFeeContext } from '../utils/studentFeeMatching';

describe('student fee selection and dimensions', () => {
  const primaryStudent: any = {
    id: 'student-1', stageId: 'stage-primary', gradeId: 'grade-1', classroom: 'الصف الأول الابتدائي',
    educationLevel: 'ابتدائي', costCenterId: 'cc_primary'
  };
  const stages: any[] = [{ id: 'stage-primary', code: 'PRI', type: 'primary', name: 'المرحلة الابتدائية', costCenterId: 'cc_primary' }];
  const grades: any[] = [{ id: 'grade-1', stageId: 'stage-primary', name: 'الأول الابتدائي', order: 1, isActive: true }];

  it('resolves the registered stage and its cost center', () => {
    expect(resolveStudentFeeContext(primaryStudent, stages, grades)).toMatchObject({
      stageId: 'stage-primary', stageType: 'primary', costCenter: 'cc_primary', gradeOrder: 1
    });
  });

  it('matches the configured grade tariff and excludes another grade band', () => {
    const context = resolveStudentFeeContext(primaryStudent, stages, grades)!;
    expect(feeConfigMatchesStudent({ type: 'الرسوم الدراسية — الابتدائي (الأول إلى الثالث)', amount: 2_500_000 }, context)).toBe(true);
    expect(feeConfigMatchesStudent({ type: 'الرسوم الدراسية — الابتدائي (الرابع والخامس)', amount: 2_600_000 }, context)).toBe(false);
    expect(feeConfigMatchesStudent({ type: 'الرسوم الدراسية — المتوسط (الأول والثاني)', amount: 2_600_000 }, context)).toBe(false);
    expect(feeConfigMatchesStudent({ type: 'الرسوم الدراسية — الابتدائي (الرابع والخامس)', amount: 2_600_000 }, { ...context, gradeOrder: 4, gradeText: 'الرابع الابتدائي' })).toBe(true);
  });

  it('keeps uniform fees available while preserving the student dimension', () => {
    const context = resolveStudentFeeContext(primaryStudent, stages, grades)!;
    expect(feeConfigMatchesStudent({ type: 'رسوم الزي المدرسي — الصغير', amount: 100_000 }, context)).toBe(true);
    expect(feeConfigMatchesStudent({ type: 'رسوم الزي المدرسي — الكبير', amount: 120_000 }, context)).toBe(true);
  });

  it('does not offer an unclassified tuition tariff', () => {
    const context = resolveStudentFeeContext(primaryStudent, stages, grades)!;
    expect(feeConfigMatchesStudent({ type: 'رسوم دراسية عامة', amount: 1 }, context)).toBe(false);
  });
});

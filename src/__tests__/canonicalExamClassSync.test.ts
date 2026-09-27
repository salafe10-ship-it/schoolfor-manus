import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnitOfWork } from '../database/UnitOfWork';
import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import { CanonicalExamClassSyncService, buildCanonicalExamClassesFromAcademicStructure } from '../modules/exams/application/CanonicalExamClassSyncService';

afterEach(() => vi.restoreAllMocks());

describe('canonical exam class synchronization', () => {
  it('preserves the exact Student Affairs class references, capacities, sections, and stages', () => {
    const classes = buildCanonicalExamClassesFromAcademicStructure({
      sections: ['أ', 'ب'],
      classes: [
        { id: 'kg-1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true },
        { id: 'primary-1', code: 'PRI1-B', name: 'أولى ابتدائي ب', capacity: 25, isActive: true },
        { id: 'middle-1', code: 'MID1-A', name: 'أولى متوسط أ', capacity: 30, isActive: true },
        { id: 'high-1', code: 'HIGH1-A', name: 'أولى ثانوي علمي أ', capacity: 35, isActive: true },
        { id: 'inactive', code: 'PRI9-A', name: 'صف غير نشط', capacity: 20, isActive: false }
      ]
    });

    expect(classes).toEqual(expect.arrayContaining([
      { id: 'kg-1', name: 'بستان أ', level: 'kindergarten', capacity: 20, sections: ['أ'] },
      { id: 'primary-1', name: 'أولى ابتدائي ب', level: 'primary', capacity: 25, sections: ['ب'] },
      { id: 'middle-1', name: 'أولى متوسط أ', level: 'middle', capacity: 30, sections: ['أ'] },
      { id: 'high-1', name: 'أولى ثانوي علمي أ', level: 'high', capacity: 35, sections: ['أ'] }
    ]));
    expect(classes).toHaveLength(4);
  });

  it('fails closed when the academic structure has an unsupported class code', () => {
    expect(() => buildCanonicalExamClassesFromAcademicStructure({
      sections: ['أ'],
      classes: [{ id: 'unknown', code: 'OTHER-A', name: 'صف غير مصنف', capacity: 20, isActive: true }]
    })).toThrow('لا يحدد مرحلة أكاديمية مدعومة');
  });

  it('bounds the live synchronization transaction and emits stage-safe diagnostics', async () => {
    const context = {
      tenantId: 'tenant-test',
      schoolId: 'school-test',
      branchId: 'branch-test',
      academicYear: 'year-test',
      userId: 'user-test'
    } as any;
    vi.spyOn(UnitOfWork, 'hasTransactionDriver').mockReturnValue(true);
    const transaction = vi.spyOn(UnitOfWork, 'runInTransaction').mockRejectedValue(new Error('test failure'));
    const info = vi.spyOn(EnterpriseLogger, 'info').mockImplementation(() => undefined);
    const error = vi.spyOn(EnterpriseLogger, 'error').mockImplementation(() => undefined);

    await expect(new CanonicalExamClassSyncService().synchronize(context, { expectedVersion: 0 }))
      .rejects.toThrow('test failure');

    const [, metadata] = transaction.mock.calls[0];
    expect(metadata.timeoutMs).toBe(9_000);
    expect(metadata.timeoutMs).toBeLessThan(15_000);
    expect(info).toHaveBeenCalledWith(
      'Canonical exam-class sync stage started.',
      'CanonicalExamClassSyncService',
      expect.objectContaining({ stage: 'transaction' })
    );
    expect(error).toHaveBeenCalledWith(
      'Canonical exam-class sync stage failed.',
      'CanonicalExamClassSyncService',
      expect.objectContaining({ stage: 'transaction', durationMs: expect.any(Number) })
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain('school-test');
  });
});

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
    expect(metadata.diagnosticTrace).toEqual({ mark: expect.any(Function) });
    metadata.diagnosticTrace.mark('pool_connection_requested');
    expect(info).toHaveBeenCalledWith(
      'Canonical exam-class sync stage started.',
      'CanonicalExamClassSyncService',
      expect.objectContaining({ stage: 'transaction' })
    );
    expect(info).toHaveBeenCalledWith(
      'Canonical exam-class sync transaction diagnostic.',
      'CanonicalExamClassSyncService',
      expect.objectContaining({ requestId: expect.any(String), stage: 'pool_connection_requested' })
    );
    expect(error).toHaveBeenCalledWith(
      'Canonical exam-class sync stage failed.',
      'CanonicalExamClassSyncService',
      expect.objectContaining({ stage: 'transaction', durationMs: expect.any(Number) })
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain('school-test');
  });

  it('records a bounded, redacted PostgreSQL error detail without logging request data', async () => {
    const context = {
      tenantId: 'tenant-test',
      schoolId: 'school-test',
      branchId: 'branch-test',
      academicYear: 'year-test',
      userId: 'user-test'
    } as any;
    vi.spyOn(UnitOfWork, 'hasTransactionDriver').mockReturnValue(true);
    const databaseError = Object.assign(new Error(
      'SSL connection failed postgres://db-user:db-pass@example.test:5432/app password=secret token: abcdef eyJabcdefgh.abcdefgh.abcdefgh admin@example.test 11111111-1111-4111-8111-111111111111'
    ), { code: '58000' });
    vi.spyOn(UnitOfWork, 'runInTransaction').mockRejectedValue(databaseError);
    vi.spyOn(EnterpriseLogger, 'info').mockImplementation(() => undefined);
    const error = vi.spyOn(EnterpriseLogger, 'error').mockImplementation(() => undefined);

    await expect(new CanonicalExamClassSyncService().synchronize(context, { expectedVersion: 0 }))
      .rejects.toThrow('SSL connection failed');

    const stageFailure = error.mock.calls.find(([message]) => message === 'Canonical exam-class sync stage failed.');
    expect(stageFailure?.[2]).toEqual(expect.objectContaining({
      databaseErrorCode: '58000',
      databaseErrorName: 'Error',
      databaseErrorMessage: expect.stringContaining('[redacted-connection]')
    }));
    const serialized = JSON.stringify(error.mock.calls);
    for (const secret of ['db-pass', 'password=secret', 'abcdef', 'abcdefgh.abcdefgh.abcdefgh', 'admin@example.test', '11111111-1111-4111-8111-111111111111', 'school-test']) {
      expect(serialized).not.toContain(secret);
    }
    expect((stageFailure?.[2] as Record<string, string>).databaseErrorMessage.length).toBeLessThanOrEqual(240);
  });
});

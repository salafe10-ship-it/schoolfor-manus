import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runWithTenantContext, type TenantContext } from '../tenant/TenantContext';
import { StudentGuardianRepository } from '../database/repositories/StudentGuardianRepository';

const mocks = vi.hoisted(() => ({
  records: [] as any[],
  healthy: false,
  getSupabaseClient: vi.fn(),
  isHealthy: vi.fn(),
  getStudentGuardians: vi.fn(),
  saveStudentGuardians: vi.fn(),
  performRead: vi.fn(),
  performWrite: vi.fn()
}));

vi.mock('../database/client', () => ({
  getSupabaseClient: mocks.getSupabaseClient
}));

vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    isHealthy: mocks.isHealthy,
    getStudentGuardians: mocks.getStudentGuardians,
    saveStudentGuardians: mocks.saveStudentGuardians,
    performRead: mocks.performRead,
    performWrite: mocks.performWrite
  }
}));

const context: TenantContext = {
  tenantId: 'school-a',
  schoolId: 'school-a',
  branchId: 'branch-a',
  academicYear: 'year-a',
  userId: 'user-a',
  role: 'SchoolAdmin'
};

function scopedRecord(id: string, scope: Pick<TenantContext, 'tenantId' | 'schoolId' | 'branchId'>) {
  return {
    id,
    studentId: `student-${id}`,
    guardianId: `guardian-${id}`,
    relationType: 'father',
    isPrimary: true,
    financialLiability: false,
    smsNotifications: true,
    tenantId: scope.tenantId,
    schoolId: scope.schoolId,
    branchId: scope.branchId
  };
}

beforeEach(() => {
  mocks.healthy = false;
  mocks.records = [
    scopedRecord('same-scope', context),
    scopedRecord('foreign-school', { tenantId: 'school-b', schoolId: 'school-b', branchId: 'branch-b' }),
    scopedRecord('foreign-tenant', { tenantId: 'school-c', schoolId: 'school-c', branchId: 'branch-c' })
  ];
  mocks.isHealthy.mockResolvedValue(false);
  mocks.getStudentGuardians.mockImplementation(() => mocks.records);
  mocks.saveStudentGuardians.mockImplementation((records: any[]) => { mocks.records = records; });
  mocks.performRead.mockImplementation(async (_schoolId: string, _table: string, canonicalRead: () => Promise<any[]>, fallbackRead: () => any[]) => {
    if (mocks.healthy) return canonicalRead();
    return fallbackRead();
  });
  mocks.performWrite.mockImplementation(async (_schoolId: string, _table: string, _id: string, _operation: string, value: unknown, _databaseWrite: unknown, fallbackWrite: () => void) => {
    fallbackWrite();
    return value;
  });
  mocks.getSupabaseClient.mockReset();
  vi.clearAllMocks();
});

describe('STU-GUARDIAN-P0-001 repository scope enforcement', () => {
  it('fails closed without a complete trusted tenant context', async () => {
    const repository = new StudentGuardianRepository();

    await expect(repository.getById('school-a', 'same-scope'))
      .rejects.toThrow('Tenant context is required');
    expect(mocks.getStudentGuardians).not.toHaveBeenCalled();
  });

  it('returns only records matching trusted tenant, school, and branch', async () => {
    const repository = new StudentGuardianRepository();

    await runWithTenantContext(context, async () => {
      await expect(repository.getById('school-a', 'same-scope')).resolves.toMatchObject({ id: 'same-scope' });
      await expect(repository.getById('school-a', 'foreign-school')).resolves.toBeNull();
      await expect(repository.getById('school-a', 'foreign-tenant')).resolves.toBeNull();

      const result = await repository.getAll('school-a');
      expect(result.data.map(record => record.id)).toEqual(['same-scope']);
      expect(result.count).toBe(1);
    });
  });

  it('rejects a caller-selected school or branch before any repository operation', async () => {
    const repository = new StudentGuardianRepository();

    await runWithTenantContext(context, async () => {
      await expect(repository.getAll('school-b')).rejects.toMatchObject({ reason: 'CROSS_SCHOOL_ACCESS' });
      await expect(repository.create('school-b', { studentId: 'student-a', guardianId: 'guardian-a' }))
        .rejects.toMatchObject({ reason: 'CROSS_SCHOOL_ACCESS' });
      await expect(repository.delete('school-a', 'same-scope'))
        .rejects.toMatchObject({ details: { reason: 'LEGACY_RELATION_MUTATION_BLOCKED' } });
      expect(mocks.performWrite).not.toHaveBeenCalled();
    });
  });

  it('rejects a foreign relationship update and delete without fallback writes', async () => {
    const repository = new StudentGuardianRepository();

    await runWithTenantContext(context, async () => {
      await expect(repository.update('school-a', 'foreign-school', { isPrimary: false }))
        .rejects.toMatchObject({ details: { reason: 'LEGACY_RELATION_MUTATION_BLOCKED' } });
      await expect(repository.delete('school-a', 'foreign-school'))
        .rejects.toMatchObject({ details: { reason: 'LEGACY_RELATION_MUTATION_BLOCKED' } });
      expect(mocks.performWrite).not.toHaveBeenCalled();
    });
  });

  it('uses trusted scope predicates for Supabase reads', async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: scopedRecord('db-row', context), error: null }))
    };
    mocks.healthy = true;
    mocks.isHealthy.mockResolvedValue(true);
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
    const repository = new StudentGuardianRepository();

    await runWithTenantContext(context, async () => {
      await repository.getById('school-a', 'db-row');
    });

    expect(query.eq.mock.calls).toEqual([
      ['tenant_id', 'school-a'],
      ['school_id', 'school-a'],
      ['branch_id', 'branch-a'],
      ['id', 'db-row']
    ]);
  });

  it('does not allow client scope fields to reach a legacy create path', async () => {
    const repository = new StudentGuardianRepository();

    await runWithTenantContext(context, async () => {
      await expect(repository.create('school-a', {
        studentId: 'student-a',
        guardianId: 'guardian-a',
        schoolId: 'school-b',
        branchId: 'branch-b'
      } as any)).rejects.toMatchObject({ details: { reason: 'LEGACY_RELATION_MUTATION_BLOCKED' } });
    });
  });
});

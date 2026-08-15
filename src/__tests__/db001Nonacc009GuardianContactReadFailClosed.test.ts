import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runWithTenantContext, type TenantContext } from '../tenant/TenantContext';
import { GuardianRepository } from '../database/repositories/GuardianRepository';
import { StudentGuardianRepository } from '../database/repositories/StudentGuardianRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getGuardians: vi.fn(),
  getStudentGuardians: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    getGuardians: mocks.getGuardians,
    getStudentGuardians: mocks.getStudentGuardians
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getGuardians.mockReturnValue([{ id: 'stale-guardian', schoolId: 'school-a', name: 'Stale' }]);
  mocks.getStudentGuardians.mockReturnValue([{ id: 'stale-link', tenantId: 'tenant-a', schoolId: 'school-a', branchId: 'branch-a' }]);
});

describe('DB-001-NONACC-009 guardian/contact read fail-closed hardening', () => {
  it('does not return stale guardian fallback data when the canonical read fails', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));
    const repository = new GuardianRepository();

    await expect(repository.getById('school-a', 'stale-guardian')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getGuardians).not.toHaveBeenCalled();
  });

  it('preserves canonical empty semantics for guardian reads', async () => {
    mocks.performRead.mockImplementation(async (_schoolId, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
    const repository = new GuardianRepository();

    await expect(repository.getById('school-a', 'missing')).resolves.toBeNull();
    expect(mocks.getGuardians).not.toHaveBeenCalled();
  });

  it('does not return stale student-guardian fallback data after canonical failure and keeps tenant scope', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));
    const repository = new StudentGuardianRepository();

    await runWithTenantContext(context, async () => {
      await expect(repository.getById('school-a', 'stale-link')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    });
    expect(mocks.getStudentGuardians).not.toHaveBeenCalled();
  });
});

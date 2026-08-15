import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentAssetRepository } from '../database/repositories/StudentAssetRepository';
import { StudentLibraryAccountRepository } from '../database/repositories/StudentLibraryAccountRepository';
import { StudentMedicalRecordRepository } from '../database/repositories/StudentMedicalRecordRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getStudentAssets: vi.fn(),
  getStudentLibraryAccounts: vi.fn(),
  getStudentMedicalRecords: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    getStudentAssets: mocks.getStudentAssets,
    getStudentLibraryAccounts: mocks.getStudentLibraryAccounts,
    getStudentMedicalRecords: mocks.getStudentMedicalRecords
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getStudentAssets.mockReturnValue([{ id: 'stale-asset', studentId: 'student-a', returnedDate: undefined }]);
  mocks.getStudentLibraryAccounts.mockReturnValue([{ id: 'stale-library', studentId: 'student-a' }]);
  mocks.getStudentMedicalRecords.mockReturnValue([{ id: 'stale-medical', studentId: 'student-a' }]);
});

describe('DB-001-NONACC-011 student legacy read fail-closed hardening', () => {
  it('does not return stale Student Asset data after canonical detail failure', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));
    const repository = new StudentAssetRepository();

    await expect(repository.getById('school-a', 'stale-asset')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentAssets).not.toHaveBeenCalled();
  });

  it('does not convert Student Asset failure into false', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(StudentAssetRepository.hasActiveAssets('school-a', 'student-a'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentAssets).not.toHaveBeenCalled();
  });

  it('preserves Student Library empty semantics and blocks stale fallback on failure', async () => {
    const repository = new StudentLibraryAccountRepository();
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));
    await expect(repository.getByStudentId('school-a', 'student-a')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentLibraryAccounts).not.toHaveBeenCalled();

    mocks.performRead.mockImplementation(async (_schoolId, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
    await expect(repository.getByStudentId('school-a', 'missing')).resolves.toBeNull();
    expect(mocks.getStudentLibraryAccounts).not.toHaveBeenCalled();
  });

  it('does not convert Student Medical failure into false', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(StudentMedicalRecordRepository.hasActiveCases('school-a', 'student-a'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentMedicalRecords).not.toHaveBeenCalled();
  });

  it('returns canonical Student Medical rows for a successful list read', async () => {
    mocks.performRead.mockImplementation(async (_schoolId, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [{ id: 'canonical-medical' }], error: null })
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
    const repository = new StudentMedicalRecordRepository();

    await expect(repository.getAll('school-a', { studentId: 'student-a' }))
      .resolves.toMatchObject({ data: [{ id: 'canonical-medical' }], count: 1 });
    expect(mocks.getStudentMedicalRecords).not.toHaveBeenCalled();
  });
});

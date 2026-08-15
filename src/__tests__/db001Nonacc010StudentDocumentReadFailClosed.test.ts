import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentDocumentRepository } from '../database/repositories/StudentDocumentRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getStudentDocuments: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    getStudentDocuments: mocks.getStudentDocuments
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getStudentDocuments.mockReturnValue([{ id: 'stale-doc', studentId: 'student-a' }]);
});

describe('DB-001-NONACC-010 student document read fail-closed hardening', () => {
  it('does not return a stale document when the canonical detail read fails', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));
    const repository = new StudentDocumentRepository();

    await expect(repository.getById('school-a', 'stale-doc')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentDocuments).not.toHaveBeenCalled();
  });

  it('preserves canonical empty detail semantics', async () => {
    mocks.performRead.mockImplementation(async (_schoolId, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
    const repository = new StudentDocumentRepository();

    await expect(repository.getById('school-a', 'missing')).resolves.toBeNull();
    expect(mocks.getStudentDocuments).not.toHaveBeenCalled();
  });

  it('does not turn a canonical failure in the active-document guard into false', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(StudentDocumentRepository.hasActiveDocuments('school-a', 'student-a'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentDocuments).not.toHaveBeenCalled();
  });

  it('returns canonical rows for an existing list query', async () => {
    mocks.performRead.mockImplementation(async (_schoolId, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [{ id: 'canonical-doc' }], error: null })
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
    const repository = new StudentDocumentRepository();

    await expect(repository.getAll('school-a', { studentId: 'student-a' }))
      .resolves.toMatchObject({ data: [{ id: 'canonical-doc' }], count: 1 });
    expect(mocks.getStudentDocuments).not.toHaveBeenCalled();
  });
});

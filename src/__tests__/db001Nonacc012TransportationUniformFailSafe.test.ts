import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransportationRepository } from '../database/repositories/TransportationRepository';
import { UniformRepository } from '../database/repositories/UniformRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  performWrite: vi.fn(),
  getBuses: vi.fn(),
  getUniforms: vi.fn(),
  saveBuses: vi.fn(),
  saveUniforms: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    performWrite: mocks.performWrite,
    getBuses: mocks.getBuses,
    getUniforms: mocks.getUniforms,
    saveBuses: mocks.saveBuses,
    saveUniforms: mocks.saveUniforms
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getBuses.mockReturnValue([{ id: 'stale-bus', schoolId: 'school-a', routeNumber: 'R1', driverName: 'Driver' }]);
  mocks.getUniforms.mockReturnValue([{ id: 'stale-uniform', schoolId: 'school-a' }]);
});

describe('DB-001-NONACC-012 transportation/uniform fail-safe containment', () => {
  it('does not return stale transportation data after canonical read failure', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(TransportationRepository.getById('school-a', 'stale-bus'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getBuses).not.toHaveBeenCalled();
  });

  it('does not return stale uniform data or false after canonical read failure', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(UniformRepository.getById('school-a', 'stale-uniform'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(UniformRepository.hasUnpaidUniform('school-a', 'student-a'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getUniforms).not.toHaveBeenCalled();
  });

  it('preserves canonical empty detail semantics', async () => {
    mocks.performRead.mockImplementation(async (_schoolId, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    await expect(TransportationRepository.getById('school-a', 'missing')).resolves.toBeNull();
    await expect(UniformRepository.getById('school-a', 'missing')).resolves.toBeNull();
    expect(mocks.getBuses).not.toHaveBeenCalled();
    expect(mocks.getUniforms).not.toHaveBeenCalled();
  });

  it('does not report a successful local transportation delete after canonical write failure', async () => {
    mocks.performWrite.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(TransportationRepository.delete('school-a', 'stale-bus'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getBuses).not.toHaveBeenCalled();
  });

  it('does not report a successful local uniform delete after canonical write failure', async () => {
    mocks.performWrite.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(UniformRepository.delete('school-a', 'stale-uniform'))
      .rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getUniforms).not.toHaveBeenCalled();
  });
});

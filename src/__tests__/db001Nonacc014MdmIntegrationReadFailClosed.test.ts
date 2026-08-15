import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MDMRepository } from '../database/repositories/MDMRepository';
import { IntegrationRepository } from '../database/repositories/IntegrationRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getMdmRegistry: vi.fn(),
  getApiConfigurations: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    getMdmRegistry: mocks.getMdmRegistry,
    getApiConfigurations: mocks.getApiConfigurations
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getMdmRegistry.mockReturnValue([{ id: 'stale-mdm' }]);
  mocks.getApiConfigurations.mockReturnValue([{ id: 'stale-api' }]);
});

describe('DB-001-NONACC-014 MDM/Integration read fail-closed hardening', () => {
  it('does not return stale MDM or Integration data after canonical failure', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(new MDMRepository().getRegistry('students', 'stale-mdm')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(new IntegrationRepository().getApiConfig('stale-api')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getMdmRegistry).not.toHaveBeenCalled();
    expect(mocks.getApiConfigurations).not.toHaveBeenCalled();
  });

  it('preserves canonical empty undefined semantics', async () => {
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    await expect(new MDMRepository().getRegistry('students', 'missing')).resolves.toBeUndefined();
    await expect(new IntegrationRepository().getApiConfig('missing')).resolves.toBeUndefined();
    expect(mocks.getMdmRegistry).not.toHaveBeenCalled();
    expect(mocks.getApiConfigurations).not.toHaveBeenCalled();
  });

  it('returns canonical records on successful reads', async () => {
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => canonicalRead());
    const mdmQuery = {
      select: vi.fn(() => mdmQuery),
      eq: vi.fn(() => mdmQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'canonical-mdm' }, error: null }))
    };
    const apiQuery = {
      select: vi.fn(() => apiQuery),
      eq: vi.fn(() => apiQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'canonical-api' }, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn((table: string) => table === 'mdm_registry' ? mdmQuery : apiQuery) });

    await expect(new MDMRepository().getRegistry('students', 'canonical-mdm')).resolves.toMatchObject({ id: 'canonical-mdm' });
    await expect(new IntegrationRepository().getApiConfig('canonical-api')).resolves.toMatchObject({ id: 'canonical-api' });
  });
});

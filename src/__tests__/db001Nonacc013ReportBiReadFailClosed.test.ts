import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportRepository } from '../database/repositories/ReportRepository';
import { BIRepository } from '../database/repositories/BIRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getReportDefinitions: vi.fn(),
  getKpiDefinitions: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    getReportDefinitions: mocks.getReportDefinitions,
    getKpiDefinitions: mocks.getKpiDefinitions
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getReportDefinitions.mockReturnValue([{ id: 'stale-report' }]);
  mocks.getKpiDefinitions.mockReturnValue([{ id: 'stale-kpi' }]);
});

describe('DB-001-NONACC-013 report/BI read fail-closed hardening', () => {
  it('does not return stale report or KPI data after canonical failure', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(new ReportRepository().getDefinition('stale-report')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(new BIRepository().getKpi('stale-kpi')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getReportDefinitions).not.toHaveBeenCalled();
    expect(mocks.getKpiDefinitions).not.toHaveBeenCalled();
  });

  it('preserves canonical empty semantics for report and KPI detail reads', async () => {
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    await expect(new ReportRepository().getDefinition('missing')).resolves.toBeUndefined();
    await expect(new BIRepository().getKpi('missing')).resolves.toBeUndefined();
    expect(mocks.getReportDefinitions).not.toHaveBeenCalled();
    expect(mocks.getKpiDefinitions).not.toHaveBeenCalled();
  });

  it('returns canonical records on successful reads', async () => {
    let call = 0;
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => {
      call += 1;
      return canonicalRead();
    });
    const reportQuery = {
      select: vi.fn(() => reportQuery),
      eq: vi.fn(() => reportQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'canonical-report' }, error: null }))
    };
    const kpiQuery = {
      select: vi.fn(() => kpiQuery),
      eq: vi.fn(() => kpiQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'canonical-kpi' }, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn((table: string) => table === 'report_definitions' ? reportQuery : kpiQuery) });

    await expect(new ReportRepository().getDefinition('canonical-report')).resolves.toMatchObject({ id: 'canonical-report' });
    await expect(new BIRepository().getKpi('canonical-kpi')).resolves.toMatchObject({ id: 'canonical-kpi' });
    expect(call).toBe(2);
  });
});

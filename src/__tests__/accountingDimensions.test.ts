import { describe, expect, it } from 'vitest';
import { buildAccountingDimensions, validateAccountingDimension } from '../modules/accounting/domain/accountingDimensions';

describe('accounting dimensions contract', () => {
  const stages = [{ id: 'stage-primary', code: 'PRI', name: 'الابتدائي', type: 'primary', costCenterId: 'cc_primary', isActive: true }];
  const centers = [{ id: 'cc_primary', code: 'CC_PRIMARY', name: 'مركز الابتدائي', stageId: 'stage-primary', isActive: true }];

  it('links one active cost center to its academic stage', () => {
    const dimensions = buildAccountingDimensions(stages, centers);
    expect(dimensions[0]).toMatchObject({ key: 'primary', stageId: 'stage-primary', stageName: 'الابتدائي', active: true });
  });

  it('accepts aliases but rejects inactive or unknown dimensions', () => {
    const dimensions = buildAccountingDimensions(stages, centers);
    expect(validateAccountingDimension('stage_primary', dimensions).valid).toBe(true);
    expect(validateAccountingDimension('secondary', dimensions).valid).toBe(false);
  });

  it('does not expose an inactive stage as a valid accounting dimension', () => {
    const dimensions = buildAccountingDimensions([{ ...stages[0], isActive: false }], centers);
    expect(validateAccountingDimension('primary', dimensions).valid).toBe(false);
  });
});

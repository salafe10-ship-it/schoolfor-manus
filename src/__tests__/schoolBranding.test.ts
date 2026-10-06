import { describe, expect, it } from 'vitest';
import { resolveCostCenterStageLogoKey } from '../utils/schoolBranding';

describe('school branding by cost center', () => {
  const activeCenters = [
    { id: 'cc-primary-id', code: 'CC_PRIMARY', name: 'الابتدائي', isActive: true },
    { id: 'cc-middle-id', code: 'ST-MID', name: 'المتوسط', isActive: true },
    { id: 'cc-secondary-id', code: 'CC_HIGH', name: 'الثانوي', isActive: true },
    { id: 'disabled-primary-id', code: 'PRIMARY', name: 'ابتدائي غير مفعل', isActive: false }
  ];

  it.each([
    ['cc-primary-id', 'primary'],
    ['CC_PRIMARY', 'primary'],
    ['cc-middle-id', 'middle'],
    ['ST-MID', 'middle'],
    ['cc-secondary-id', 'secondary'],
    ['CC_HIGH', 'secondary']
  ])('resolves active cost center %s to its school stage logo', (costCenter, stage) => {
    expect(resolveCostCenterStageLogoKey(costCenter, activeCenters)).toBe(stage);
  });

  it('does not assign stage logos to all-centers, unknown, or disabled filters', () => {
    expect(resolveCostCenterStageLogoKey('all', activeCenters)).toBeNull();
    expect(resolveCostCenterStageLogoKey('disabled-primary-id', activeCenters)).toBeNull();
    expect(resolveCostCenterStageLogoKey('unclassified', activeCenters)).toBeNull();
  });
});

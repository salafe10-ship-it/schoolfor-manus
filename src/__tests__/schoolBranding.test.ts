import { describe, expect, it } from 'vitest';
import { getDefaultStageLogoPath, resolveCostCenterStageLogoKey, resolveSchoolStageLogoSource } from '../utils/schoolBranding';

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

  it('resolves the Arabic stage label shown on student receipts', () => {
    expect(resolveCostCenterStageLogoKey('مرحلة • الابتدائي')).toBe('primary');
    expect(resolveCostCenterStageLogoKey('مرحلة • المتوسط')).toBe('middle');
    expect(resolveCostCenterStageLogoKey('مرحلة • الثانوي')).toBe('secondary');
  });

  it.each([
    ['primary', '/branding/stages/primary.png'],
    ['middle', '/branding/stages/middle.png'],
    ['secondary', '/branding/stages/secondary.png']
  ] as const)('provides the shipped %s stage-logo fallback', (stage, path) => {
    expect(getDefaultStageLogoPath(stage)).toBe(path);
  });

  it('does not infer a stage-logo fallback when the cost center is unknown', () => {
    expect(getDefaultStageLogoPath(null)).toBeNull();
  });

  it('prefers a configured stage logo, then the bundled stage logo, then the general school logo', () => {
    expect(resolveSchoolStageLogoSource('secondary', { secondary: 'https://cdn.example.test/secondary.png' }, 'https://cdn.example.test/school.png'))
      .toBe('https://cdn.example.test/secondary.png');
    expect(resolveSchoolStageLogoSource('middle', {}, 'https://cdn.example.test/school.png'))
      .toBe('/branding/stages/middle.png');
    expect(resolveSchoolStageLogoSource(null, {}, 'https://cdn.example.test/school.png'))
      .toBe('https://cdn.example.test/school.png');
  });

  it('rejects unsafe or unsupported configured logo sources', () => {
    expect(resolveSchoolStageLogoSource('primary', { primary: 'javascript:alert(1)' }, 'javascript:alert(2)'))
      .toBe('/branding/stages/primary.png');
    expect(resolveSchoolStageLogoSource(null, {}, '//untrusted.example.test/logo.png')).toBe('');
  });
});

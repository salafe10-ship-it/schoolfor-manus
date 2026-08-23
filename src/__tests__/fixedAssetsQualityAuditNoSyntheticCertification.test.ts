import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('EnterpriseFixedAssetsQualityAudit authoritative certification contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/assets/EnterpriseFixedAssetsQualityAudit.tsx'), 'utf8');

  it('does not certify asset controls without central evidence', () => {
    expect(source).toContain('useState(false)');
    expect(source).toContain("metric: 'غير متحقق'");
    expect(source).toContain("isCertified ? 'معتمد' : 'غير متحقق'");
    expect(source).not.toContain('معتمد 100%');
    expect(source).not.toContain('تكامل كامل 100%');
    expect(source).not.toContain('فحوصات ناجحة');
  });
});

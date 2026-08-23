import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FixedAssetsDashboard authoritative match contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/assets/FixedAssetsDashboard.tsx'), 'utf8');

  it('does not claim a 100 percent financial match without evidence', () => {
    expect(source).toContain("totalAssets > 0 ? 'مطابقة غير متحققة' : 'غير متحقق'");
    expect(source).not.toContain('100% مطابقة');
  });
});

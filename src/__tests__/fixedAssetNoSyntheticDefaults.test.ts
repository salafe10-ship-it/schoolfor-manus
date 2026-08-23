import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('fixed asset registration integrity', () => {
  it('requires traceable acquisition data before capitalization', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/assets/AssetLifecycleOperationsModal.tsx'),
      'utf8'
    );
    expect(source).toContain("code: '',");
    expect(source).toContain("barcode: '',");
    expect(source).toContain('قبل الرسملة');
    expect(source).toContain('cost + capitalExp <= 0');
    expect(source).not.toContain("barcode: `6291000${Math.floor");
    expect(source).toContain('min="0.01"');
    expect(source).toContain('textarea required value={transferData.reason}');
  });
});

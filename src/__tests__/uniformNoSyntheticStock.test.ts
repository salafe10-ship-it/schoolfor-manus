import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('uniform inventory truthfulness', () => {
  it('does not seed stock when creating a uniform item', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/SchoolUniformManagement.tsx'), 'utf8');
    expect(source).toContain('stockQty: 0');
    expect(source).toContain('برصيد ابتدائي صفر');
    expect(source).not.toContain('stockQty: 100');
    expect(source).not.toContain('رصيد افتراضي 100 قطعة');
  });
});

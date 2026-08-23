import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/StudentAffairsPortal.tsx', 'utf8');

describe('Student Affairs registration form contract', () => {
  it('exposes the required canonical registration status field', () => {
    expect(source).toContain('value={formData.status}');
    expect(source).toContain('<option value="active">نشط ومنتظم</option>');
    expect(source).toContain('<option value="suspended">موقوف القيد</option>');
    expect(source).toContain('<option value="inactive">منسحب / منقول</option>');
  });
});

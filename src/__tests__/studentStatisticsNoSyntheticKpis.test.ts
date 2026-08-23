import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('StudentStatisticsCards authoritative KPI contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/StudentStatisticsCards.tsx'), 'utf8');

  it('does not display hardcoded age or data accuracy claims', () => {
    expect(source).toContain('const averageAge = useMemo');
    expect(source).toContain("{averageAge ?? 'غير متحقق'}");
    expect(source).toContain('غير متحقق</p>');
    expect(source).not.toContain('>11 <span');
    expect(source).not.toContain('>100%</p>');
  });
});

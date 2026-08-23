import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');

describe('Student Affairs query/meta contract', () => {
  it('uses the current server query total for empty-state and pagination text', () => {
    expect(source).toContain('const visibleQueryCount = studentQueryMeta.totalCount;');
    expect(source).toContain("visibleQueryCount === 0 && !searchKeyword.trim()");
    expect(source).toContain('Math.min(studentQueryMeta.page * studentQueryMeta.limit, visibleQueryCount)');
  });
});

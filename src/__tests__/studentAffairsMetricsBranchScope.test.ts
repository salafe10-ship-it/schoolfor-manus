import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('student affairs metrics branch scope', () => {
  it('includes branch-scoped and school-wide student rows consistently', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/repositories/CanonicalStudentReadRepository.ts'), 'utf8');
    const start = source.indexOf('async function queryCanonicalStudentAffairsMetrics');
    const end = source.indexOf('export class CanonicalStudentReadRepository', start);
    const query = source.slice(start, end);
    expect(query).toContain('AND (s.branch_id = $3 OR s.branch_id IS NULL)');
    expect(query).toContain('s.tenant_id = $1');
    expect(query).toContain('s.school_id = $2');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const serverSource = source('server.ts');
const portalSource = source('src/components/StudentAffairsPortal.tsx');
const repositorySource = source('src/components/student-affairs/repository/StudentRepository.ts');

describe('STU-AFFAIRS-P1-003-04A server-authoritative pagination contract', () => {
  it('returns authoritative page metadata and enforces request bounds', () => {
    expect(serverSource).toContain("limit: parseStudentQueryInteger(limit, 'limit', 50, 100)");
    expect(serverSource).toContain('totalPages: Math.max(1, Math.ceil(result.totalCount / result.limit))');
    expect(serverSource).toContain('hasNext:');
    expect(serverSource).toContain('hasPrevious:');
    expect(serverSource).toContain('parseStudentSortBy(sortBy)');
    expect(serverSource).toContain('parseStudentSortOrder(sortOrder)');
  });

  it('keeps tenant scope server-derived and rejects the unsupported finance filter', () => {
    expect(serverSource).toContain('tenantEngine.validate(await tenantEngine.resolve(identity');
    expect(serverSource).toContain("throw new ValidationError('مرشح المستحقات المالية غير متاح");
    expect(serverSource).not.toContain('feesOutstandingOnly: feesOutstanding ===');
  });

  it('requests the selected page and server filters instead of slicing locally', () => {
    expect(portalSource).toContain('page: currentPage');
    expect(portalSource).toContain('limit: rowsPerPage');
    expect(portalSource).toContain('section: searchClass');
    expect(portalSource).toContain('controller.signal');
    expect(portalSource).not.toContain('filteredStudents.slice(');
    expect(portalSource).not.toContain('setStudentQueryMeta({ page: 1, limit: 100');
  });

  it('uses one repository request contract with abort support', () => {
    expect(repositorySource).toContain('signal?: AbortSignal');
    expect(repositorySource).toContain('signal');
  });
});

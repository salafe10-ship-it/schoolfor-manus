import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(
  resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'),
  'utf8'
);

function blockBetween(startMarker: string, endMarker: string): string {
  const start = portalSource.indexOf(startMarker);
  const end = portalSource.indexOf(endMarker, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return portalSource.slice(start, end);
}

describe('STU-AFFAIRS-P1-PRIV-008 sensitive data exposure', () => {
  it('keeps National ID and Guardian Phone out of the active student list', () => {
    const listBlock = blockBetween('const paginatedStudents', '{/*');
    expect(listBlock).not.toContain('st.nationalId');
    expect(listBlock).not.toContain('st.parentPhone');
  });

  it('keeps Guardian Phone out of the Guardian summary cards', () => {
    const guardianBlock = blockBetween("students.filter(st => Boolean(st.parentName || st.parentPhone))", "{activeTab === 'documents'");
    expect(guardianBlock).not.toContain('{st.parentPhone ||');
  });

  it('keeps sensitive values out of the print rows and student profile view', () => {
    const printBlock = blockBetween('{printPreviewStudents && (', 'MODAL 3: BATCH TRANSFER / PROMOTION WIZARD');
    const profileBlock = blockBetween('{viewStudent && (', 'MODAL 3: BATCH TRANSFER / PROMOTION WIZARD');
    expect(printBlock).not.toContain('st.parentPhone');
    expect(profileBlock).not.toContain('viewStudent.nationalId');
    expect(profileBlock).not.toContain('viewStudent.parentPhone');
  });

  it('retains sensitive fields only where explicitly needed for controlled editing', () => {
    expect(portalSource).toContain('value={formData.nationalId}');
    expect(portalSource).toContain('value={formData.parentPhone}');
    expect(portalSource).not.toContain('الهوية الوطنية: {viewStudent.nationalId');
  });
});

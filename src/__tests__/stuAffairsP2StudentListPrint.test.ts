import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
const start = source.indexOf('const handlePrintList = (onlySelected = false) => {');
const end = source.indexOf('\n  };', start);
const printBlock = source.slice(start, end);

describe('STU-AFFAIRS-P2-006-66 Student list print truthfulness', () => {
  it('keeps the print action responsive and validates empty selected scope', () => {
    expect(printBlock).toContain('if (onlySelected && selectedStudentIds.length === 0)');
    expect(printBlock).not.toContain('if (isLoadingStudents)');
    expect(printBlock).not.toContain('if (studentLoadError)');
    expect(source).toContain('type="button"');
    expect(source).toContain('onClick={() => handlePrintList(false)}');
    expect(source).not.toContain('onClick={handlePrintList}');
  });

  it('opens the print filter workflow before loading a complete report scope', () => {
    expect(printBlock).toContain('setPrintOnlySelected(onlySelected)');
    expect(printBlock).toContain('setPrintFilterStage(\'all\')');
    expect(printBlock).toContain('setIsPrintFilterOpen(true)');
    expect(source).toContain('const loadAllStudentsForPrint = async (): Promise<Student[]> => {');
    expect(source).toContain('const handleApplyPrintFilters = async () => {');
    expect(source).toContain('printFilterStage');
    expect(source).toContain('printFilterGrade');
    expect(source).toContain('printFilterClass');
    expect(source).toContain('printFilterSection');
    expect(source).toContain('خيارات طباعة كشف الطلاب');
    expect(source).toContain('كل المرشحات غير المحددة = الكل');
    expect(source).toContain('إجمالي الكشف: {printPreviewStudents.length} طالب');
    expect(source).toContain('معاينة كشف الطلاب');
    expect(source).toContain('النطاق: جميع الطلاب');
    expect(source).not.toContain('window.open');
  });

  it('does not add Guardian Phone or National ID to the printed HTML', () => {
    const previewBlock = source.slice(source.indexOf('{printPreviewStudents && ('), source.indexOf('MODAL 3: BATCH TRANSFER / PROMOTION WIZARD'));
    expect(previewBlock).not.toContain('parentPhone');
    expect(previewBlock).not.toContain('nationalId');
    expect(previewBlock).toContain('student.parentName');
  });
});

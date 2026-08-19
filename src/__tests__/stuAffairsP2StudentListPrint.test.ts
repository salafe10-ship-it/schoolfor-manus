import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');
const start = source.indexOf('const handlePrintList = () => {');
const end = source.indexOf('\n  };', start);
const printBlock = source.slice(start, end);

describe('STU-AFFAIRS-P2-006-66 Student list print truthfulness', () => {
  it('blocks loading, error, and empty print attempts', () => {
    expect(printBlock).toContain('if (isLoadingStudents)');
    expect(printBlock).toContain('if (studentLoadError)');
    expect(printBlock).toContain('if (printableStudents.length === 0)');
    expect(printBlock).toContain('انتظر اكتمال تحميل الصفوف الحالية قبل الطباعة.');
    expect(printBlock).toContain('لا يمكن الطباعة أثناء وجود خطأ');
  });

  it('prints the current filtered page and uses truthful browser-print wording', () => {
    expect(printBlock).toContain('const printableStudents = selectedStudentIds.length > 0');
    expect(printBlock).toContain('const rowsHTML = printableStudents.map');
    expect(printBlock).toContain('إجمالي الكشف: ${printableStudents.length} طالب');
    expect(printBlock).toContain('filteredStudents.map');
    expect(printBlock).toContain('طباعة كشف الطلاب المعروض حاليًا');
    expect(printBlock).toContain('ليست تقريرًا رسميًا شاملًا');
    expect(printBlock).not.toContain('تقرير رسمي كامل');
    expect(printBlock).not.toContain('window.fetch');
    expect(printBlock).not.toContain('fetch(');
  });

  it('does not add Guardian Phone or National ID to the printed HTML', () => {
    expect(printBlock).not.toContain('parentPhone');
    expect(printBlock).not.toContain('nationalId');
    expect(printBlock).toContain('st.parentName');
  });
});

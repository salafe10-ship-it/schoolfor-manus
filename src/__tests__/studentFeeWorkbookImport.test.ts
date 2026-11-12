import { describe, expect, it } from 'vitest';
import { parseStudentFeeWorkbook, spreadsheetDateToIso, workbookGradeOrdinal } from '../modules/financial/domain/StudentFeeWorkbookImport';

describe('student fee workbook import', () => {
  it('parses the canonical three-row header and paired plan/payment columns', () => {
    const matrix = [
      ['خطة الاقساط', ...Array(62).fill('')],
      ['', ...Array(62).fill('')],
      ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(4).fill(''), 'القسط الاول', 'تاريخه', ...Array(10).fill(''), 'المبلغ', 'تاريخ السداد', 'رقم بنكك', 'نقدى'],
      [1, 'طالب اختبار', '', '123', '', '', '', 'ابتدائي', 'الاول', '1', ...Array(10).fill(''), 2500000, 625000, 1875000, ...Array(4).fill(''), 250000, 46266, ...Array(10).fill(''), 250000, 46266, '4950', '']
    ];
    const parsed = parseStudentFeeWorkbook(matrix);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({ name: 'طالب اختبار', grossAmount: 2500000, discountAmount: 625000, netAmount: 1875000, stage: 'ابتدائي', grade: 'الاول', section: '1' });
    expect(parsed.rows[0].plans[0]).toEqual({ amount: 250000, dueDate: '2026-09-01' });
    expect(parsed.rows[0].payments[0]).toMatchObject({ amount: 250000, date: '2026-09-01', bankReference: '4950' });
  });

  it('converts spreadsheet serial dates and grade labels deterministically', () => {
    expect(spreadsheetDateToIso(46266)).toBe('2026-09-01');
    expect(workbookGradeOrdinal('الصف السادس')).toBe(6);
  });

  it('rejects a partial plan or payment row instead of silently inventing dates', () => {
    const header = ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(4).fill(''), 'القسط الاول', 'تاريخه', ...Array(10).fill(''), 'المبلغ', 'تاريخ السداد', 'رقم بنكك', 'نقدى'];
    const row = [...Array(63).fill('')];
    row[1] = 'طالب اختبار'; row[20] = 2500000; row[21] = 0; row[22] = 2500000; row[27] = 250000; row[28] = '';
    expect(() => parseStudentFeeWorkbook([header, row])).toThrow('قسطًا ناقص');
  });
});


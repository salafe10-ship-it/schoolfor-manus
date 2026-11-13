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

  it('keeps a valid claim while skipping and reporting a partial plan or payment row', () => {
    const header = ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(4).fill(''), 'القسط الاول', 'تاريخه', ...Array(10).fill(''), 'المبلغ', 'تاريخ السداد', 'رقم بنكك', 'نقدى'];
    const row = [...Array(63).fill('')];
    row[1] = 'طالب اختبار'; row[20] = 2500000; row[21] = 0; row[22] = 2500000; row[27] = 250000; row[28] = '';
    const parsed = parseStudentFeeWorkbook([header, row]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].plans).toEqual([]);
    expect(parsed.issues).toEqual([expect.objectContaining({
      workbookRow: 2,
      name: 'طالب اختبار',
      category: 'installment',
    })]);
  });

  it('derives net claims when a spreadsheet formula has no cached value', () => {
    const header = ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(40).fill('')];
    const row = [...Array(63).fill('')];
    row[1] = 'طالب اختبار'; row[20] = 2500000; row[21] = 625000; row[22] = '';
    const parsed = parseStudentFeeWorkbook([header, row]);
    expect(parsed.rows[0].netAmount).toBe(1875000);
    expect(parsed.issues).toEqual([]);
  });

  it('excludes every repeated name-grade-section row for review', () => {
    const header = ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(40).fill('')];
    const makeRow = (gross: number) => {
      const row = [...Array(63).fill('')];
      row[1] = 'طالب مكرر'; row[7] = 'ابتدائي'; row[8] = 'الاول'; row[9] = '1'; row[20] = gross; row[21] = 0; row[22] = gross;
      return row;
    };
    const parsed = parseStudentFeeWorkbook([header, makeRow(100), makeRow(200)]);
    expect(parsed.rows).toEqual([]);
    expect(parsed.issues).toHaveLength(2);
    expect(parsed.issues.every(issue => issue.category === 'identity')).toBe(true);
  });

  it('does not confuse a repeated name across different stages with a duplicate student', () => {
    const header = ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(40).fill('')];
    const makeRow = (stage: string) => {
      const row = [...Array(63).fill('')];
      row[1] = 'طالب اختبار'; row[7] = stage; row[8] = 'الاول'; row[9] = '1'; row[20] = 100; row[21] = 0; row[22] = 100;
      return row;
    };
    const parsed = parseStudentFeeWorkbook([header, makeRow('ابتدائي'), makeRow('الروضة')]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.issues).toEqual([]);
  });

  it('reports a nameless financial row when it contains only payment date or reference data', () => {
    const header = ['الرقم', 'الاسم الكامل', 'رقم الطالب', 'رقم الهوية', 'الاسم الكامل', 'الجنس', 'تاريخ الميلاد', 'المرحلة الدراسية', 'الصف الدراسى', 'الفصل', ...Array(10).fill(''), 'قيمة المطالبة', 'التخفيض', 'الصافى', ...Array(40).fill('')];
    const row = [...Array(63).fill('')];
    row[40] = 46266;
    row[41] = 'BANK-REF-TEST';
    const parsed = parseStudentFeeWorkbook([header, row]);
    expect(parsed.rows).toEqual([]);
    expect(parsed.issues).toEqual([expect.objectContaining({
      workbookRow: 2,
      name: 'غير محدد',
      category: 'identity',
    })]);
  });
});


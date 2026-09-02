import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  EXAM_GRADE_EXPORT_HEADERS,
  ExamSpreadsheetValidationError,
  buildExamGradeWorkbook,
  normalizeExamSpreadsheetHeader,
  readExamGradeSpreadsheet,
  writeExamGradeCsv,
  writeExamGradeXlsx,
  type ExamGradeWorkbookInput
} from '../modules/exams/application/ExamSpreadsheetService';
import { parseCsvMatrix, worksheetToMatrix } from '../utils/ExcelWorkbookUtils';

const students = [
  {
    id: 'student-1',
    studentNumber: 'ST-001',
    nationalId: 'NAT-001',
    seatNumber: '101',
    name: 'آمنة محمد'
  },
  {
    id: 'student-2',
    studentCode: 'ST-002',
    nationalId: 'NAT-002',
    seatNumber: '102',
    name: 'مصطفى علي'
  }
];

const exportInput: ExamGradeWorkbookInput = {
  subject: { id: 'arabic', name: 'اللغة العربية', maxScore: 100 },
  rows: [
    {
      studentId: 'student-1',
      studentNumber: 'ST-001',
      nationalId: 'NAT-001',
      seatNumber: '101',
      studentName: 'آمنة محمد',
      classroom: 'الصف الرابع',
      section: 'أ',
      grade: 87.5
    },
    {
      studentId: 'student-2',
      studentNumber: 'ST-002',
      nationalId: 'NAT-002',
      seatNumber: '102',
      studentName: 'مصطفى علي',
      classroom: 'الصف الرابع',
      section: 'ب',
      grade: null
    }
  ]
};

async function workbookBytes(rows: unknown[][]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Grades');
  worksheet.addRows(rows);
  const output = await workbook.xlsx.writeBuffer();
  return Uint8Array.from(output as unknown as ArrayLike<number>).buffer;
}

function utf8Bytes(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer as ArrayBuffer;
}

async function capturedValidationError(run: () => unknown | Promise<unknown>): Promise<ExamSpreadsheetValidationError> {
  try {
    await run();
  } catch (error) {
    expect(error).toBeInstanceOf(ExamSpreadsheetValidationError);
    return error as ExamSpreadsheetValidationError;
  }
  throw new Error('Expected ExamSpreadsheetValidationError.');
}

describe('ExamSpreadsheetService', () => {
  it('builds a real XLSX workbook with Arabic headers, Arabic rows, and numeric grades', async () => {
    const workbook = buildExamGradeWorkbook(exportInput);
    expect(workbook.worksheets.map(worksheet => worksheet.name)).toEqual(['درجات الامتحان']);

    const output = await writeExamGradeXlsx(exportInput);
    expect(Array.from(new Uint8Array(output, 0, 2))).toEqual([0x50, 0x4B]);

    const parsed = new ExcelJS.Workbook();
    await parsed.xlsx.load(output as unknown as Buffer);
    const rows = worksheetToMatrix(parsed.getWorksheet('درجات الامتحان')!);
    expect(rows[0]).toEqual([...EXAM_GRADE_EXPORT_HEADERS]);
    expect(rows[1]).toEqual([
      'student-1',
      'ST-001',
      'NAT-001',
      '101',
      'آمنة محمد',
      'الصف الرابع',
      'أ',
      'اللغة العربية',
      100,
      87.5
    ]);
    expect(rows[2][4]).toBe('مصطفى علي');
    expect(rows[2][9]).toBe('');
  });

  it('neutralizes CSV formula injection, including markers hidden behind whitespace', () => {
    const csv = writeExamGradeCsv({
      subject: { id: 'science', name: '=HYPERLINK("https://bad.example")', maxScore: 50 },
      rows: [
        {
          studentId: '=1+1',
          studentNumber: '+cmd|calc',
          nationalId: '-2+3',
          seatNumber: '@SUM(1,1)',
          studentName: '   =HYPERLINK("https://bad.example")',
          classroom: '\t=1+1',
          section: 'أ',
          grade: 40
        }
      ]
    });
    expect(csv.charCodeAt(0)).toBe(0xFEFF);

    const rows = parseCsvMatrix(new TextDecoder().decode(utf8Bytes(csv)));
    expect(rows[1][0]).toBe("'=1+1");
    expect(rows[1][1]).toBe("'+cmd|calc");
    expect(rows[1][2]).toBe("'-2+3");
    expect(rows[1][3]).toBe("'@SUM(1,1)");
    expect(rows[1][4]).toBe("'   =HYPERLINK(\"https://bad.example\")");
    expect(rows[1][5]).toBe("'\t=1+1");
    expect(rows[1][7]).toBe("'=HYPERLINK(\"https://bad.example\")");
  });

  it('normalizes Arabic and English header variants', () => {
    expect(normalizeExamSpreadsheetHeader('\uFEFF رَقْمُ الطَّالِب ')).toBe('studentNumber');
    expect(normalizeExamSpreadsheetHeader('Student_ID')).toBe('studentId');
    expect(normalizeExamSpreadsheetHeader('Seat No.')).toBe('seatNumber');
    expect(normalizeExamSpreadsheetHeader('MAX-SCORE')).toBe('maxScore');
    expect(normalizeExamSpreadsheetHeader('الدَرَجَة الحَالِيَّة')).toBe('grade');
    expect(normalizeExamSpreadsheetHeader('unknown column')).toBeNull();
  });

  it('reads XLSX rows with Arabic headers and returns a complete grade map', async () => {
    const result = await readExamGradeSpreadsheet(await workbookBytes([
      ['ملاحظات كشف اللغة العربية'],
      ['رقم الطالب', 'اسم الطالب', 'الدرجة الحالية'],
      ['ST-001', 'آمنة محمد', 91.5],
      ['NAT-002', 'مصطفى علي', 74]
    ]), {
      subjectId: 'arabic',
      maxScore: 100,
      students
    });

    expect(result.rowCount).toBe(2);
    expect(result.gradesByStudentId).toEqual({ 'student-1': 91.5, 'student-2': 74 });
    expect(result.rows.map(row => [row.studentId, row.sourceRow, row.matchedBy])).toEqual([
      ['student-1', 3, 'studentNumber'],
      ['student-2', 4, 'studentNumber']
    ]);
  });

  it('reads XLSX bytes with English headers', async () => {
    const result = await readExamGradeSpreadsheet(await workbookBytes([
      ['Student ID', 'Student Name', 'Mark'],
      ['student-1', 'آمنة محمد', 66],
      ['student-2', 'مصطفى علي', 77]
    ]), {
      subjectId: 'science',
      maxScore: 100,
      students
    });

    expect(result.gradesByStudentId).toEqual({ 'student-1': 66, 'student-2': 77 });
    expect(result.rows.every(row => row.matchedBy === 'studentId')).toBe(true);
  });

  it('reads UTF-8 CSV ArrayBuffer and accepts Arabic-Indic decimal grades', async () => {
    const csv = '\uFEFFرقم الجلوس,اسم الطالب,Score\r\n101,آمنة محمد,٨٧٫٥\r\n102,مصطفى علي,٦٢';
    const result = await readExamGradeSpreadsheet(utf8Bytes(csv), {
      subjectId: 'arabic',
      maxScore: 100,
      students
    });

    expect(result.gradesByStudentId).toEqual({ 'student-1': 87.5, 'student-2': 62 });
    expect(result.rows.every(row => row.matchedBy === 'seatNumber')).toBe(true);
  });

  it('rejects the whole file and reports invalid, missing, duplicate, and out-of-range rows together', async () => {
    const error = await capturedValidationError(() => workbookBytes([
      ['Student Number', 'Grade'],
      ['ST-001', 80],
      ['ST-001', 70],
      ['UNKNOWN', 60],
      ['ST-002', 101],
      ['', 50],
      ['ST-002', '=1+1']
    ]).then(value => readExamGradeSpreadsheet(value, {
      subjectId: 'arabic',
      maxScore: 100,
      students
    })));

    const codes = error.issues.map(issue => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      'duplicate_student',
      'student_not_found',
      'grade_out_of_range',
      'missing_student_identifier',
      'invalid_grade'
    ]));
    expect(error.message).toContain('تم رفض ملف الدرجات بالكامل');
  });

  it('rejects duplicate students even when different identifier columns are used', async () => {
    const error = await capturedValidationError(() => workbookBytes([
      ['معرف الطالب', 'رقم الطالب', 'الدرجة'],
      ['student-1', '', 90],
      ['', 'NAT-001', 80]
    ]).then(value => readExamGradeSpreadsheet(value, {
      subjectId: 'arabic',
      maxScore: 100,
      students
    })));
    expect(error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'duplicate_student', row: 3, value: 'student-1' })
    ]));
  });

  it('rejects conflicting identifiers and ambiguous roster identifiers without guessing a student', async () => {
    const conflicting = await capturedValidationError(() => workbookBytes([
      ['Student ID', 'Seat Number', 'Grade'],
      ['student-1', '102', 88]
    ]).then(value => readExamGradeSpreadsheet(value, {
      subjectId: 'arabic',
      maxScore: 100,
      students
    })));
    expect(conflicting.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'conflicting_student_identifiers', row: 2 })
    ]));

    const ambiguous = await capturedValidationError(() => workbookBytes([
      ['Seat Number', 'Grade'],
      ['101', 88]
    ]).then(value => readExamGradeSpreadsheet(value, {
      subjectId: 'arabic',
      maxScore: 100,
      students: [...students, { id: 'student-3', seatNumber: '101', name: 'طالب آخر' }]
    })));
    expect(ambiguous.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ambiguous_student_identifier', row: 2 })
    ]));
  });

  it('rejects missing required headers and header-only files', async () => {
    const missingHeader = await capturedValidationError(() => workbookBytes([
      ['اسم الطالب', 'المادة'],
      ['آمنة محمد', 'العربية']
    ]).then(value => readExamGradeSpreadsheet(value, {
      subjectId: 'arabic',
      maxScore: 100,
      students
    })));
    expect(missingHeader.issues.map(issue => issue.code)).toEqual([
      'missing_required_header',
      'missing_required_header'
    ]);

    const noRows = await capturedValidationError(() => workbookBytes([
      ['Student ID', 'Grade']
    ]).then(value => readExamGradeSpreadsheet(value, {
      subjectId: 'arabic',
      maxScore: 100,
      students
    })));
    expect(noRows.issues).toEqual([
      expect.objectContaining({ code: 'no_data_rows' })
    ]);
  });
});

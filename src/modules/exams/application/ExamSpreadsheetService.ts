import * as XLSX from 'xlsx';

export const EXAM_GRADE_XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const EXAM_GRADE_CSV_CONTENT_TYPE = 'text/csv;charset=utf-8';
export const EXAM_GRADE_DEFAULT_SHEET_NAME = 'درجات الامتحان';

export const EXAM_GRADE_EXPORT_HEADERS = [
  'معرف الطالب',
  'رقم الطالب',
  'الرقم الوطني',
  'رقم الجلوس',
  'اسم الطالب',
  'الصف',
  'الشعبة',
  'المادة',
  'الدرجة العظمى',
  'الدرجة'
] as const;

export interface ExamSpreadsheetSubject {
  id: string;
  name: string;
  maxScore: number;
}

export interface ExamGradeExportRow {
  studentId: string;
  studentNumber?: string | number | null;
  nationalId?: string | number | null;
  seatNumber?: string | number | null;
  studentName: string;
  classroom?: string | null;
  section?: string | null;
  grade?: number | null;
}

export interface ExamGradeWorkbookInput {
  subject: ExamSpreadsheetSubject;
  rows: readonly ExamGradeExportRow[];
  sheetName?: string;
}

export interface ExamSpreadsheetStudent {
  id: string;
  studentNumber?: string | number | null;
  studentCode?: string | number | null;
  academicId?: string | number | null;
  nationalId?: string | number | null;
  seatNumber?: string | number | null;
  name?: string | null;
}

export interface ExamGradeImportOptions {
  subjectId: string;
  maxScore: number;
  students: readonly ExamSpreadsheetStudent[];
  sheetName?: string;
}

export type ExamSpreadsheetImportColumn =
  | 'studentId'
  | 'studentNumber'
  | 'nationalId'
  | 'seatNumber'
  | 'studentName'
  | 'subject'
  | 'maxScore'
  | 'grade';

type ExamSpreadsheetIdentifierColumn = Extract<
  ExamSpreadsheetImportColumn,
  'studentId' | 'studentNumber' | 'nationalId' | 'seatNumber'
>;

export type ExamSpreadsheetIssueCode =
  | 'invalid_configuration'
  | 'invalid_file'
  | 'empty_workbook'
  | 'worksheet_not_found'
  | 'missing_required_header'
  | 'duplicate_header'
  | 'no_data_rows'
  | 'missing_student_identifier'
  | 'student_not_found'
  | 'ambiguous_student_identifier'
  | 'conflicting_student_identifiers'
  | 'duplicate_student'
  | 'missing_grade'
  | 'invalid_grade'
  | 'grade_out_of_range';

export interface ExamSpreadsheetIssue {
  code: ExamSpreadsheetIssueCode;
  message: string;
  row?: number;
  column?: ExamSpreadsheetImportColumn;
  value?: unknown;
}

export interface ImportedExamGrade {
  studentId: string;
  subjectId: string;
  grade: number;
  sourceRow: number;
  matchedBy: ExamSpreadsheetIdentifierColumn;
}

export interface ExamGradeImportResult {
  subjectId: string;
  rowCount: number;
  rows: readonly ImportedExamGrade[];
  gradesByStudentId: Readonly<Record<string, number>>;
}

export class ExamSpreadsheetValidationError extends Error {
  readonly issues: readonly ExamSpreadsheetIssue[];

  constructor(issues: readonly ExamSpreadsheetIssue[]) {
    const firstMessage = issues[0]?.message || 'ملف الدرجات غير صالح.';
    const remainder = issues.length > 1 ? ` (+${issues.length - 1} أخطاء)` : '';
    super(`تم رفض ملف الدرجات بالكامل: ${firstMessage}${remainder}`);
    this.name = 'ExamSpreadsheetValidationError';
    this.issues = Object.freeze(issues.map(issue => Object.freeze({ ...issue })));
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const IDENTIFIER_COLUMNS: readonly ExamSpreadsheetIdentifierColumn[] = [
  'studentId',
  'studentNumber',
  'nationalId',
  'seatNumber'
];

const HEADER_ALIASES: Record<ExamSpreadsheetImportColumn, readonly string[]> = {
  studentId: [
    'معرف الطالب',
    'معرّف الطالب',
    'هوية الطالب الداخلية',
    'student id',
    'student_id',
    'internal student id'
  ],
  studentNumber: [
    'رقم الطالب',
    'الرقم الطلابي',
    'الرقم المدرسي',
    'كود الطالب',
    'student number',
    'student no',
    'student no.',
    'student code',
    'admission number',
    'admission no'
  ],
  nationalId: [
    'الرقم الوطني',
    'الرقم القومي',
    'رقم الهوية',
    'الهوية الوطنية',
    'national id',
    'national number',
    'identity number'
  ],
  seatNumber: [
    'رقم الجلوس',
    'رقم المقعد',
    'seat number',
    'seat no',
    'seat no.',
    'candidate number',
    'exam number'
  ],
  studentName: [
    'اسم الطالب',
    'الطالب',
    'student name',
    'candidate name'
  ],
  subject: [
    'المادة',
    'اسم المادة',
    'المادة الدراسية',
    'subject',
    'subject name'
  ],
  maxScore: [
    'الدرجة العظمى',
    'الدرجة النهائية',
    'النهاية العظمى',
    'الحد الأعلى',
    'الحد الاعلى',
    'max score',
    'maximum score',
    'total mark',
    'max mark'
  ],
  grade: [
    'الدرجة',
    'الدرجة الحالية',
    'الدرجة المحصلة',
    'العلامة',
    'العلامه',
    'grade',
    'score',
    'mark',
    'marks'
  ]
};

function normalizeHeaderToken(value: unknown): string {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[\u0640\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '');
}

const HEADER_ALIAS_LOOKUP = new Map<string, ExamSpreadsheetImportColumn>();
for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [ExamSpreadsheetImportColumn, readonly string[]][]) {
  for (const alias of aliases) {
    HEADER_ALIAS_LOOKUP.set(normalizeHeaderToken(alias), column);
  }
}

export function normalizeExamSpreadsheetHeader(value: unknown): ExamSpreadsheetImportColumn | null {
  return HEADER_ALIAS_LOOKUP.get(normalizeHeaderToken(value)) ?? null;
}

/**
 * Prefixes text that spreadsheet programs could interpret as a formula. The
 * protection is applied to every exported text cell and is preserved in CSV.
 */
export function escapeExamSpreadsheetFormula(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const detectionValue = text.normalize('NFKC');
  const startsWithControlCharacter = /^[\u0000-\u001F]/.test(detectionValue);
  const startsWithFormulaMarker = /^[\u0000-\u0020]*[=+\-@]/.test(detectionValue);
  return startsWithControlCharacter || startsWithFormulaMarker ? `'${text}` : text;
}

function requireValidSubject(subject: ExamSpreadsheetSubject): void {
  if (!String(subject?.id || '').trim() || !String(subject?.name || '').trim()) {
    throw new ExamSpreadsheetValidationError([{
      code: 'invalid_configuration',
      message: 'يجب تحديد معرف المادة واسمها قبل إنشاء ملف الدرجات.'
    }]);
  }
  if (!Number.isFinite(subject.maxScore) || subject.maxScore <= 0) {
    throw new ExamSpreadsheetValidationError([{
      code: 'invalid_configuration',
      message: 'الدرجة العظمى للمادة يجب أن تكون رقماً موجباً صالحاً.'
    }]);
  }
}

function safeSheetName(value: string | undefined): string {
  const sanitized = String(value || EXAM_GRADE_DEFAULT_SHEET_NAME)
    .replace(/[\\/?*\[\]:]/g, ' ')
    .trim()
    .slice(0, 31);
  return sanitized || EXAM_GRADE_DEFAULT_SHEET_NAME;
}

function exportGradeValue(grade: number | null | undefined, maxScore: number, rowNumber: number): number | '' {
  if (grade === null || grade === undefined) return '';
  if (!Number.isFinite(grade)) {
    throw new ExamSpreadsheetValidationError([{
      code: 'invalid_grade',
      message: `الصف ${rowNumber}: الدرجة المراد تصديرها ليست رقماً صالحاً.`,
      row: rowNumber,
      column: 'grade',
      value: grade
    }]);
  }
  if (grade < 0 || grade > maxScore) {
    throw new ExamSpreadsheetValidationError([{
      code: 'grade_out_of_range',
      message: `الصف ${rowNumber}: الدرجة خارج النطاق 0–${maxScore}.`,
      row: rowNumber,
      column: 'grade',
      value: grade
    }]);
  }
  return grade;
}

export function buildExamGradeWorkbook(input: ExamGradeWorkbookInput): XLSX.WorkBook {
  requireValidSubject(input.subject);
  const seenStudentIds = new Set<string>();
  const dataRows = input.rows.map((row, index) => {
    const sourceRow = index + 2;
    const studentId = String(row.studentId || '').trim();
    if (!studentId) {
      throw new ExamSpreadsheetValidationError([{
        code: 'missing_student_identifier',
        message: `الصف ${sourceRow}: معرف الطالب مطلوب للتصدير.`,
        row: sourceRow,
        column: 'studentId'
      }]);
    }
    if (seenStudentIds.has(studentId)) {
      throw new ExamSpreadsheetValidationError([{
        code: 'duplicate_student',
        message: `الصف ${sourceRow}: الطالب مكرر في بيانات التصدير.`,
        row: sourceRow,
        column: 'studentId',
        value: studentId
      }]);
    }
    seenStudentIds.add(studentId);

    return [
      escapeExamSpreadsheetFormula(studentId),
      escapeExamSpreadsheetFormula(row.studentNumber),
      escapeExamSpreadsheetFormula(row.nationalId),
      escapeExamSpreadsheetFormula(row.seatNumber),
      escapeExamSpreadsheetFormula(row.studentName),
      escapeExamSpreadsheetFormula(row.classroom),
      escapeExamSpreadsheetFormula(row.section),
      escapeExamSpreadsheetFormula(input.subject.name),
      input.subject.maxScore,
      exportGradeValue(row.grade, input.subject.maxScore, sourceRow)
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([
    [...EXAM_GRADE_EXPORT_HEADERS],
    ...dataRows
  ]);
  worksheet['!cols'] = [
    { wch: 38 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
    { wch: 20 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 }
  ];
  worksheet['!autofilter'] = { ref: `A1:J${Math.max(dataRows.length + 1, 1)}` };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(input.sheetName));
  return workbook;
}

export function writeExamGradeXlsx(input: ExamGradeWorkbookInput): ArrayBuffer {
  const workbook = buildExamGradeWorkbook(input);
  const output = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
    compression: true
  }) as ArrayBuffer;
  const signature = new Uint8Array(output, 0, Math.min(output.byteLength, 2));
  if (signature.length < 2 || signature[0] !== 0x50 || signature[1] !== 0x4B) {
    throw new Error('XLSX artifact validation failed.');
  }
  return output;
}

export function writeExamGradeCsv(input: ExamGradeWorkbookInput): string {
  const workbook = buildExamGradeWorkbook(input);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return `\uFEFF${XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\r\n', blankrows: false })}`;
}

function isEmptyCell(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function isEmptyRow(row: readonly unknown[]): boolean {
  return row.every(isEmptyCell);
}

function normalizeIdentifier(value: unknown): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value !== 'string') return '';
  return value
    .replace(/^\uFEFF/, '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US');
}

function normalizeNumericText(value: string): string {
  const easternArabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let normalized = value
    .replace(/[٠-٩]/g, digit => String(easternArabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String(persianDigits.indexOf(digit)))
    .replace(/٫/g, '.')
    .replace(/٬/g, '')
    .trim();
  if (!normalized.includes('.') && (normalized.match(/,/g) || []).length === 1) {
    normalized = normalized.replace(',', '.');
  }
  return normalized;
}

function parseGradeCell(
  value: unknown,
  row: number,
  maxScore: number,
  issues: ExamSpreadsheetIssue[]
): number | null {
  if (isEmptyCell(value)) {
    issues.push({
      code: 'missing_grade',
      message: `الصف ${row}: الدرجة مطلوبة.`,
      row,
      column: 'grade'
    });
    return null;
  }

  let grade: number;
  if (typeof value === 'number') {
    grade = value;
  } else if (typeof value === 'string') {
    const normalized = normalizeNumericText(value);
    if (!/^[+\-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
      issues.push({
        code: 'invalid_grade',
        message: `الصف ${row}: الدرجة ليست رقماً صالحاً.`,
        row,
        column: 'grade',
        value
      });
      return null;
    }
    grade = Number(normalized);
  } else {
    issues.push({
      code: 'invalid_grade',
      message: `الصف ${row}: الدرجة ليست رقماً صالحاً.`,
      row,
      column: 'grade',
      value
    });
    return null;
  }

  if (!Number.isFinite(grade)) {
    issues.push({
      code: 'invalid_grade',
      message: `الصف ${row}: الدرجة ليست رقماً صالحاً.`,
      row,
      column: 'grade',
      value
    });
    return null;
  }
  if (grade < 0 || grade > maxScore) {
    issues.push({
      code: 'grade_out_of_range',
      message: `الصف ${row}: الدرجة خارج النطاق 0–${maxScore}.`,
      row,
      column: 'grade',
      value: grade
    });
    return null;
  }
  return grade;
}

type StudentLookup = Record<
  ExamSpreadsheetIdentifierColumn,
  Map<string, ExamSpreadsheetStudent[]>
>;

function addLookupValue(
  map: Map<string, ExamSpreadsheetStudent[]>,
  value: unknown,
  student: ExamSpreadsheetStudent
): void {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return;
  const matches = map.get(normalized) || [];
  if (!matches.some(match => match.id === student.id)) matches.push(student);
  map.set(normalized, matches);
}

function buildStudentLookup(students: readonly ExamSpreadsheetStudent[]): StudentLookup {
  const lookup: StudentLookup = {
    studentId: new Map(),
    studentNumber: new Map(),
    nationalId: new Map(),
    seatNumber: new Map()
  };
  const seenIds = new Set<string>();

  for (const student of students) {
    const id = String(student?.id || '').trim();
    if (!id || seenIds.has(id)) {
      throw new ExamSpreadsheetValidationError([{
        code: 'invalid_configuration',
        message: !id
          ? 'توجد هوية طالب فارغة في نطاق الاستيراد.'
          : `معرف الطالب ${id} مكرر في نطاق الاستيراد.`,
        value: id
      }]);
    }
    seenIds.add(id);
    addLookupValue(lookup.studentId, id, student);

    // "رقم الطالب" is intentionally compatible with legacy templates that
    // used the national or internal identifier in this column.
    for (const value of [student.studentNumber, student.studentCode, student.academicId, student.nationalId, id]) {
      addLookupValue(lookup.studentNumber, value, student);
    }
    addLookupValue(lookup.nationalId, student.nationalId, student);
    addLookupValue(lookup.seatNumber, student.seatNumber, student);
  }

  return lookup;
}

function findHeaderRowIndex(table: readonly (readonly unknown[])[]): number {
  let firstNonEmpty = -1;
  let bestIndex = -1;
  let bestRecognizedColumns = 0;
  table.forEach((row, index) => {
    if (isEmptyRow(row)) return;
    if (firstNonEmpty === -1) firstNonEmpty = index;
    const recognized = new Set(row.map(normalizeExamSpreadsheetHeader).filter(Boolean));
    if (recognized.size > bestRecognizedColumns) {
      bestRecognizedColumns = recognized.size;
      bestIndex = index;
    }
  });
  return bestIndex === -1 ? firstNonEmpty : bestIndex;
}

function resolveHeaderColumns(
  headerRow: readonly unknown[],
  excelRow: number
): Map<ExamSpreadsheetImportColumn, number> {
  const columns = new Map<ExamSpreadsheetImportColumn, number>();
  const issues: ExamSpreadsheetIssue[] = [];
  headerRow.forEach((header, index) => {
    const normalized = normalizeExamSpreadsheetHeader(header);
    if (!normalized) return;
    if (columns.has(normalized)) {
      issues.push({
        code: 'duplicate_header',
        message: `الصف ${excelRow}: رأس العمود ${String(header)} يكرر عموداً معروفاً.`,
        row: excelRow,
        column: normalized,
        value: header
      });
      return;
    }
    columns.set(normalized, index);
  });

  if (!columns.has('grade')) {
    issues.push({
      code: 'missing_required_header',
      message: 'ملف الدرجات لا يحتوي عمود الدرجة المطلوب.',
      row: excelRow,
      column: 'grade'
    });
  }
  if (!IDENTIFIER_COLUMNS.some(column => columns.has(column))) {
    issues.push({
      code: 'missing_required_header',
      message: 'ملف الدرجات لا يحتوي عموداً معروفاً لمعرف الطالب أو رقمه أو رقم جلوسه.',
      row: excelRow,
      column: 'studentId'
    });
  }
  if (issues.length > 0) throw new ExamSpreadsheetValidationError(issues);
  return columns;
}

interface ResolvedStudent {
  student: ExamSpreadsheetStudent | null;
  matchedBy: ExamSpreadsheetIdentifierColumn | null;
}

function resolveStudent(
  rowValues: readonly unknown[],
  excelRow: number,
  columns: ReadonlyMap<ExamSpreadsheetImportColumn, number>,
  lookup: StudentLookup,
  issues: ExamSpreadsheetIssue[]
): ResolvedStudent {
  const resolvedStudents = new Map<string, ExamSpreadsheetStudent>();
  let suppliedIdentifierCount = 0;
  let matchedBy: ExamSpreadsheetIdentifierColumn | null = null;

  for (const column of IDENTIFIER_COLUMNS) {
    const columnIndex = columns.get(column);
    if (columnIndex === undefined) continue;
    const rawValue = rowValues[columnIndex];
    const normalizedValue = normalizeIdentifier(rawValue);
    if (!normalizedValue) continue;
    suppliedIdentifierCount += 1;
    const candidates = lookup[column].get(normalizedValue) || [];
    if (candidates.length === 0) {
      issues.push({
        code: 'student_not_found',
        message: `الصف ${excelRow}: الطالب ذو المعرف ${String(rawValue)} غير موجود في النطاق الحالي.`,
        row: excelRow,
        column,
        value: rawValue
      });
      continue;
    }
    if (candidates.length > 1) {
      issues.push({
        code: 'ambiguous_student_identifier',
        message: `الصف ${excelRow}: المعرف ${String(rawValue)} يطابق أكثر من طالب.`,
        row: excelRow,
        column,
        value: rawValue
      });
      continue;
    }
    const student = candidates[0];
    resolvedStudents.set(student.id, student);
    if (!matchedBy) matchedBy = column;
  }

  if (suppliedIdentifierCount === 0) {
    issues.push({
      code: 'missing_student_identifier',
      message: `الصف ${excelRow}: يجب إدخال معرف طالب واحد على الأقل.`,
      row: excelRow,
      column: 'studentId'
    });
    return { student: null, matchedBy: null };
  }
  if (resolvedStudents.size > 1) {
    issues.push({
      code: 'conflicting_student_identifiers',
      message: `الصف ${excelRow}: معرفات الطالب في الصف تشير إلى طلاب مختلفين.`,
      row: excelRow
    });
    return { student: null, matchedBy };
  }
  return {
    student: resolvedStudents.values().next().value ?? null,
    matchedBy
  };
}

function validateImportOptions(options: ExamGradeImportOptions): void {
  const issues: ExamSpreadsheetIssue[] = [];
  if (!String(options?.subjectId || '').trim()) {
    issues.push({ code: 'invalid_configuration', message: 'معرف المادة مطلوب لاستيراد الدرجات.' });
  }
  if (!Number.isFinite(options?.maxScore) || options.maxScore <= 0) {
    issues.push({ code: 'invalid_configuration', message: 'الدرجة العظمى للمادة يجب أن تكون رقماً موجباً صالحاً.' });
  }
  if (!Array.isArray(options?.students)) {
    issues.push({ code: 'invalid_configuration', message: 'نطاق الطلاب المطلوب للتحقق غير صالح.' });
  }
  if (issues.length > 0) throw new ExamSpreadsheetValidationError(issues);
}

/**
 * Reads XLSX, legacy XLS, or CSV bytes and returns one complete validated
 * batch. Any issue rejects the whole file; no partial grade map is returned.
 */
export function readExamGradeSpreadsheet(
  fileData: ArrayBuffer,
  options: ExamGradeImportOptions
): ExamGradeImportResult {
  validateImportOptions(options);
  // Files selected in an iframe, worker, or test DOM can originate from a
  // different JavaScript realm. `instanceof ArrayBuffer` rejects those valid
  // buffers, while their intrinsic tag remains stable across realms.
  const isArrayBuffer = Object.prototype.toString.call(fileData) === '[object ArrayBuffer]';
  if (!isArrayBuffer || fileData.byteLength === 0) {
    throw new ExamSpreadsheetValidationError([{
      code: 'invalid_file',
      message: 'ملف الدرجات فارغ أو ليس ArrayBuffer صالحاً.'
    }]);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(fileData.slice(0)), {
      type: 'array',
      raw: true,
      cellDates: false
    });
  } catch {
    throw new ExamSpreadsheetValidationError([{
      code: 'invalid_file',
      message: 'تعذر قراءة الملف كـ XLSX أو XLS أو CSV صالح.'
    }]);
  }

  if (!Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
    throw new ExamSpreadsheetValidationError([{
      code: 'empty_workbook',
      message: 'ملف الدرجات لا يحتوي أي ورقة عمل.'
    }]);
  }

  const sheetName = options.sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new ExamSpreadsheetValidationError([{
      code: 'worksheet_not_found',
      message: `ورقة العمل ${sheetName} غير موجودة في الملف.`,
      value: sheetName
    }]);
  }

  const table = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: true
  });
  const headerIndex = findHeaderRowIndex(table);
  if (headerIndex < 0) {
    throw new ExamSpreadsheetValidationError([{
      code: 'empty_workbook',
      message: 'ورقة الدرجات فارغة.'
    }]);
  }

  const columns = resolveHeaderColumns(table[headerIndex], headerIndex + 1);
  const studentLookup = buildStudentLookup(options.students);
  const issues: ExamSpreadsheetIssue[] = [];
  const importedRows: ImportedExamGrade[] = [];
  const firstSourceRowByStudentId = new Map<string, number>();
  let meaningfulRows = 0;

  for (let index = headerIndex + 1; index < table.length; index += 1) {
    const rowValues = table[index];
    if (isEmptyRow(rowValues)) continue;
    meaningfulRows += 1;
    const excelRow = index + 1;
    const issuesBeforeRow = issues.length;
    const resolved = resolveStudent(rowValues, excelRow, columns, studentLookup, issues);
    const grade = parseGradeCell(rowValues[columns.get('grade')!], excelRow, options.maxScore, issues);

    if (resolved.student) {
      const firstSourceRow = firstSourceRowByStudentId.get(resolved.student.id);
      if (firstSourceRow !== undefined) {
        issues.push({
          code: 'duplicate_student',
          message: `الصف ${excelRow}: الطالب مكرر؛ ظهر أولاً في الصف ${firstSourceRow}.`,
          row: excelRow,
          column: resolved.matchedBy || 'studentId',
          value: resolved.student.id
        });
      } else {
        firstSourceRowByStudentId.set(resolved.student.id, excelRow);
      }
    }

    if (
      issues.length === issuesBeforeRow
      && resolved.student
      && resolved.matchedBy
      && grade !== null
    ) {
      importedRows.push({
        studentId: resolved.student.id,
        subjectId: options.subjectId,
        grade,
        sourceRow: excelRow,
        matchedBy: resolved.matchedBy
      });
    }
  }

  if (meaningfulRows === 0) {
    issues.push({
      code: 'no_data_rows',
      message: 'ملف الدرجات لا يحتوي أي صف طالب.'
    });
  }
  if (issues.length > 0) throw new ExamSpreadsheetValidationError(issues);

  const frozenRows = Object.freeze(importedRows.map(row => Object.freeze({ ...row })));
  const gradesByStudentId = Object.freeze(Object.fromEntries(
    frozenRows.map(row => [row.studentId, row.grade])
  ));
  return Object.freeze({
    subjectId: options.subjectId,
    rowCount: frozenRows.length,
    rows: frozenRows,
    gradesByStudentId
  });
}

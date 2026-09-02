import ExcelJS from 'exceljs';

export type SpreadsheetRow = readonly unknown[];

export type XlsxSheetDefinition = {
  name: string;
  headers?: readonly string[];
  rows: readonly (SpreadsheetRow | Record<string, unknown>)[];
  columnWidths?: readonly number[];
};

function excelColumnName(columnNumber: number): string {
  let number = Math.max(1, Math.floor(columnNumber));
  let name = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

const ZIP_SIGNATURE = [0x50, 0x4b];

function isZipBuffer(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data);
  return bytes.length >= 2 && bytes[0] === ZIP_SIGNATURE[0] && bytes[1] === ZIP_SIGNATURE[1];
}

function cellValueToPrimitive(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (value instanceof Date) return value;

  // Formula results are intentionally not trusted during imports. A file
  // supplied by a user must provide a literal value, not executable content or
  // a cached formula result from another workbook.
  if ('formula' in value) return '';
  if ('richText' in value && Array.isArray((value as { richText?: unknown }).richText)) {
    return (value as { richText: Array<{ text?: unknown }> }).richText
      .map(part => String(part?.text ?? ''))
      .join('');
  }
  if ('text' in value) return String((value as { text?: unknown }).text ?? '');
  return value;
}

export function worksheetToMatrix(worksheet: ExcelJS.Worksheet): unknown[][] {
  const matrix: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: true }, row => {
    const values = Array.isArray(row.values) ? row.values : [];
    matrix.push(values.slice(1).map(cellValueToPrimitive));
  });
  return matrix;
}

/**
 * Minimal RFC 4180-compatible CSV reader for import paths. It deliberately
 * returns literal strings only; spreadsheet formulas are never evaluated.
 */
export function parseCsvMatrix(input: string): unknown[][] {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0 || text.endsWith(',')) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export async function readSpreadsheetMatrix(data: ArrayBuffer, sheetName?: string): Promise<unknown[][]> {
  if (!data || data.byteLength === 0) throw new Error('ملف جدول فارغ.');
  if (!isZipBuffer(data)) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
    if (!text.trim()) throw new Error('ملف جدول فارغ.');
    return parseCsvMatrix(text);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as unknown as Buffer);
  const worksheet = sheetName
    ? workbook.getWorksheet(sheetName)
    : workbook.worksheets[0];
  if (!worksheet) throw new Error(`ورقة العمل ${sheetName || ''} غير موجودة.`);
  return worksheetToMatrix(worksheet);
}

export async function readSpreadsheetRecords(data: ArrayBuffer, sheetName?: string): Promise<Record<string, unknown>[]> {
  const matrix = await readSpreadsheetMatrix(data, sheetName);
  const headers = matrix[0] || [];
  return matrix.slice(1)
    .filter(row => row.some(value => String(value ?? '').trim() !== ''))
    .map(row => headers.reduce<Record<string, unknown>>((record, header, index) => {
      const key = String(header ?? '').trim();
      if (key) record[key] = row[index] ?? '';
      return record;
    }, {}));
}

export function safeSpreadsheetCell(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? '';
  const normalized = value.normalize('NFKC');
  return /^[\u0000-\u0020]*[=+\-@]/.test(normalized) ? `'${value}` : value;
}

function normalizedSheetName(value: string): string {
  const name = String(value || 'Sheet1').replace(/[\\/?*\[\]:]/g, ' ').trim().slice(0, 31);
  return name || 'Sheet1';
}

export async function writeXlsxBuffer(sheets: readonly XlsxSheetDefinition[]): Promise<ArrayBuffer> {
  if (sheets.length === 0) throw new Error('يجب تحديد ورقة واحدة على الأقل لإنشاء ملف XLSX.');

  const workbook = new ExcelJS.Workbook();
  for (const definition of sheets) {
    const worksheet = workbook.addWorksheet(normalizedSheetName(definition.name));
    const firstRow = definition.rows[0];
    const headers = definition.headers || (
      firstRow && !Array.isArray(firstRow) ? Object.keys(firstRow) : undefined
    );

    if (headers && headers.length > 0) {
      worksheet.addRow(headers.map(safeSpreadsheetCell));
      worksheet.getRow(1).font = { bold: true };
    }

    const rows = definition.rows.map(row => {
      const values = Array.isArray(row)
        ? row
        : (headers || Object.keys(row)).map(key => row[key]);
      return values.map(safeSpreadsheetCell);
    });
    worksheet.addRows(rows);
    worksheet.views = [{ state: 'frozen', ySplit: headers ? 1 : 0 }];
    if (headers) worksheet.autoFilter = { from: 'A1', to: `${excelColumnName(headers.length)}${Math.max(rows.length + 1, 1)}` };
    worksheet.columns = (headers || []).map((header, index) => ({
      header,
      key: `column-${index}`,
      width: definition.columnWidths?.[index] || 20
    }));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = Uint8Array.from(buffer as unknown as ArrayLike<number>);
  return bytes.buffer;
}

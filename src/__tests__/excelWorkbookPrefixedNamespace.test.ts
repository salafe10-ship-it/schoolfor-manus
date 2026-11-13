import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { readSpreadsheetMatrix } from '../utils/ExcelWorkbookUtils';

describe('Excel workbook import', () => {
  it('reads explicit x: SpreadsheetML prefixes without evaluating formulas', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ورقة1');
    sheet.addRow(['اسم الطالب', 'المبلغ']);
    sheet.addRow(['طالب اختبار', 250]);
    sheet.addRow(['صافي المطالبة', { formula: '300-50', result: 250 } as any]);

    const zip = await JSZip.loadAsync(await workbook.xlsx.writeBuffer());
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || !/^xl\/.*\.xml$/i.test(entry.name)) continue;
      const xml = await entry.async('string');
      const prefixed = xml
        .replace(/(<\/?)([A-Za-z_][\w.-]*)(?=[\s/>])/g, '$1x:$2')
        .replace(/xmlns=/g, 'xmlns:x=');
      zip.file(entry.name, prefixed);
    }

    const matrix = await readSpreadsheetMatrix(await zip.generateAsync({ type: 'arraybuffer' }));
    expect(matrix[0]).toEqual(['اسم الطالب', 'المبلغ']);
    expect(matrix[1]).toEqual(['طالب اختبار', 250]);
    expect(matrix[2]).toEqual(['صافي المطالبة', '']);
  });

  it('ignores comments and VML notes with package-absolute worksheet relationships', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ورقة1');
    sheet.addRow(['اسم الطالب', 'المبلغ']);
    sheet.addRow(['طالب اختبار', 250]);
    sheet.getCell('A1').note = 'ملاحظة توضيحية لا تدخل ضمن بيانات الخلايا.';

    const zip = await JSZip.loadAsync(await workbook.xlsx.writeBuffer());
    const relationships = await zip.file('xl/worksheets/_rels/sheet1.xml.rels')!.async('string');
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', relationships
      .replace('Target="../comments1.xml"', 'Target="/xl/comments1.xml"')
      .replace('Target="../drawings/vmlDrawing1.vml"', 'Target="/xl/drawings/vmlDrawing1.vml"'));
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || !/^xl\/.*\.xml$/i.test(entry.name)) continue;
      const xml = await entry.async('string');
      const prefixed = xml
        .replace(/(<\/?)([A-Za-z_][\w.-]*)(?=[\s/>])/g, '$1x:$2')
        .replace(/xmlns=/g, 'xmlns:x=');
      zip.file(entry.name, prefixed);
    }

    const matrix = await readSpreadsheetMatrix(await zip.generateAsync({ type: 'arraybuffer' }));
    expect(matrix).toEqual([
      ['اسم الطالب', 'المبلغ'],
      ['طالب اختبار', 250]
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { csvEscapeField } from '../modules/exams/application/CsvExportSafety';

describe('exam CSV export safety', () => {
  it.each(['=1+1', '  =HYPERLINK("https://bad.example")', '\t=1+1', '\r\n@SUM(1,1)', '＋1+1']) (
    'neutralizes spreadsheet formulas beginning with %j', value => {
      expect(csvEscapeField(value)).toBe(`"'${value.replaceAll('"', '""')}"`);
    }
  );

  it('quotes commas and doubles embedded quotes without changing ordinary Arabic text', () => {
    expect(csvEscapeField('مادة "الرياضيات", اختبار')).toBe('"مادة ""الرياضيات"", اختبار"');
    expect(csvEscapeField('قاعة اختبار 1')).toBe('"قاعة اختبار 1"');
  });
});

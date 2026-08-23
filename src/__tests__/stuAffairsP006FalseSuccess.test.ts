import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(
  resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'),
  'utf8'
);

describe('STU-AFFAIRS-P0-006-01 official card print contract', () => {
  it('does not claim a successful print before the browser print action completes', () => {
    expect(portalSource).not.toContain('تم طباعة بطاقة الطالب بنجاح');
    expect(portalSource).toContain('معاينة وطباعة البطاقة الرسمية');
    expect(portalSource).toContain('window.print()');
  });

  it('keeps the print preview scoped to the selected student and excludes controls from print', () => {
    const cardLabelIndex = portalSource.indexOf('معاينة وطباعة البطاقة الرسمية');
    expect(cardLabelIndex).toBeGreaterThan(-1);

    const cardBlock = portalSource.slice(Math.max(0, cardLabelIndex - 900), cardLabelIndex + 200);
    expect(portalSource).toContain('printable-area');
    expect(portalSource).toContain('no-print');
    expect(cardBlock).toContain('setShowIdCardPrint(true)');
  });
});

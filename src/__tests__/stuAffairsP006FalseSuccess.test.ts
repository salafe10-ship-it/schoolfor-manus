import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(
  resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'),
  'utf8'
);

describe('STU-AFFAIRS-P0-006-01 official card print safety gate', () => {
  it('does not claim a successful print without a print implementation', () => {
    expect(portalSource).not.toContain('تم طباعة بطاقة الطالب بنجاح');
    expect(portalSource).toContain('طباعة البطاقة الرسمية (غير متاحة)');
    expect(portalSource).toContain('خدمة طباعة البطاقة الرسمية غير متاحة حتى اعتماد خدمة الطباعة');
  });

  it('keeps the unavailable card action non-interactive and API-free', () => {
    const cardLabelIndex = portalSource.indexOf('طباعة البطاقة الرسمية (غير متاحة)');
    expect(cardLabelIndex).toBeGreaterThan(-1);

    const cardBlock = portalSource.slice(Math.max(0, cardLabelIndex - 900), cardLabelIndex + 200);
    expect(cardBlock).toContain('disabled');
    expect(cardBlock).toContain('aria-disabled="true"');
    expect(cardBlock).not.toContain('fetch(');
    expect(cardBlock).not.toContain('triggerNotification(');
    expect(cardBlock).not.toContain('window.print(');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(
  resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'),
  'utf8'
);

function guardianBlock(label: string): string {
  const index = portalSource.indexOf(label);
  expect(index).toBeGreaterThan(-1);
  return portalSource.slice(Math.max(0, index - 700), index + 180);
}

describe('STU-AFFAIRS-P0-006-02 Guardian unavailable-action safety', () => {
  it('keeps Guardian linking non-interactive and API-free', () => {
    const block = guardianBlock('ربط ولي أمر (قريبًا)');
    expect(block).toContain('disabled');
    expect(block).toContain('aria-disabled="true"');
    expect(block).toContain('غير متاح حاليًا');
    expect(block).not.toContain('triggerNotification(');
    expect(block).not.toContain('fetch(');
  });

  it('keeps direct contact non-interactive and API-free', () => {
    const block = guardianBlock('<span>اتصال</span>');
    expect(block).toContain('disabled');
    expect(block).toContain('aria-disabled="true"');
    expect(block).toContain('غير متاح حاليًا');
    expect(block).not.toContain('triggerNotification(');
    expect(block).not.toContain('fetch(');
  });

  it('keeps messaging non-interactive and API-free', () => {
    const block = guardianBlock('<span>رسالة</span>');
    expect(block).toContain('disabled');
    expect(block).toContain('aria-disabled="true"');
    expect(block).toContain('غير متاح حاليًا');
    expect(block).not.toContain('triggerNotification(');
    expect(block).not.toContain('fetch(');
  });
});

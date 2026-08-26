import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('exams auxiliary screen visual consistency', () => {
  it('keeps distribution and certificates inside the control-center dark gold theme', () => {
    for (const source of [
      read('src/components/exams/ExamsDistributionPanel.tsx'),
      read('src/components/exams/ExamsCertificatesPanel.tsx')
    ]) {
      expect(source).toContain('bg-[#1c120c]');
      expect(source).toContain('bg-[#130b04]');
      expect(source).toContain('border-[#d4af37]/35');
      expect(source).not.toContain('<section className="border border-slate-200 bg-white');
    }
  });
});

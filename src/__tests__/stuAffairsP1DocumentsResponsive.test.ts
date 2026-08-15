import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/modules/student-documents/presentation/StudentDocumentsPortal.tsx', 'utf8');

describe('STU-AFFAIRS-P1-006-49 document metadata responsive integrity', () => {
  it('keeps the page bounded while preserving table-local horizontal scrolling', () => {
    expect(source).toContain('overflow-x-hidden');
    expect(source).toContain('overflow-x-auto');
    expect(source).toContain('min-w-0');
  });

  it('keeps the metadata action row usable on narrow viewports', () => {
    expect(source).toContain('flex flex-wrap justify-end gap-2 border-t pt-3');
    expect(source).toContain('max-w-3xl');
    expect(source).toContain('w-full');
  });
});


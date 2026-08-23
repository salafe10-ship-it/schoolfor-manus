import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('StudentDocuments authoritative upload contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/StudentDocuments.tsx'), 'utf8');

  it('does not report a locally simulated upload as saved', () => {
    expect(source).toContain('خدمة مستندات الطلاب المركزية غير متاحة؛ لم يتم حفظ الملف.');
    expect(source).not.toContain("logAction('DOC_UPLOAD'");
    expect(source).not.toContain('securedDocs: [...(s.securedDocs || []), newDoc]');
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student documents integrity', () => {
  it('requires a selected student and does not fabricate match confidence', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentDocuments.tsx'),
      'utf8'
    );
    expect(source).toContain('if (!activePrintStudent)');
    expect(source).toContain('خدمة مستندات الطلاب المركزية غير متاحة؛ لم يتم حفظ الملف.');
    expect(source).not.toContain("logAction('DOC_UPLOAD'");
    expect(source).not.toContain("confidence: '98%'");
  });
});

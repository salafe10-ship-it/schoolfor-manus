import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/modules/student-documents/presentation/StudentDocumentsPortal.tsx', 'utf8');

describe('STU-AFFAIRS-P1-006-43 document action capability truthfulness', () => {
  it('keeps visible document actions on canonical and private endpoints only', () => {
    expect(source).toContain('/api/student-documents/${selected.document.id}/verification');
    expect(source).toContain('/api/student-documents/${selected.document.id}/archive');
    expect(source).toContain('/api/student-documents/${selected.document.id}/content-versions?');
    expect(source).toContain('/api/students/${normalized.studentId}/document-content?');
    expect(source).toContain('/api/student-documents/${selected.document.id}/content');
    expect(source).toContain('/api/student-documents/${selected.document.id}/access-log');
    expect(source).toContain("window.open(content.url, '_blank', 'noopener,noreferrer')");
    expect(source).not.toContain('URL.createObjectURL');
  });

  it('exposes approved binary controls but no unimplemented OCR or scanning claims', () => {
    expect(source).toContain('عرض/تنزيل الملف');
    expect(source).toContain('PDF/PNG/JPEG حتى 10MB');
    expect(source).not.toMatch(/aria-label="(?:OCR|مسح ضوئي)/);
    expect(source).not.toMatch(/(?:onClick|onSubmit)=\{[^}]*?(?:ocr|scan)/i);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/modules/student-documents/presentation/StudentDocumentsPortal.tsx', 'utf8');

describe('STU-AFFAIRS-P1-006-43 document action capability truthfulness', () => {
  it('keeps visible metadata actions on canonical endpoints only', () => {
    expect(source).toContain('/api/student-documents/${selected.document.id}/verification');
    expect(source).toContain('/api/student-documents/${selected.document.id}/archive');
    expect(source).toContain('/api/student-documents/${selected.document.id}/versions');
    expect(source).toContain('/api/students/${normalized.studentId}/documents');
    expect(source).toContain('/api/student-documents/${selected.document.id}/access-log');
    expect(source).not.toContain('window.open');
    expect(source).not.toContain('URL.createObjectURL');
  });

  it('does not expose binary or processing controls as implemented capabilities', () => {
    expect(source).toContain('رفع الملفات الثنائية وتنزيلها ومعاينتها وOCR والمسح الضوئي غير متاحة');
    expect(source).not.toMatch(/aria-label="(?:رفع|تنزيل|معاينة|OCR|مسح)/);
    expect(source).not.toMatch(/(?:onClick|onSubmit)=\{[^}]*?(?:upload|download|preview|ocr|scan)/i);
  });
});

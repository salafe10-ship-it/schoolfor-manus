import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('student documents canonical contract', () => {
  it('uses guarded repositories and reports success only after canonical requests', () => {
    const repository = readFileSync('src/database/repositories/StudentDocumentRepository.ts', 'utf8');
    const portal = readFileSync('src/modules/student-documents/presentation/StudentDocumentsPortal.tsx', 'utf8');
    expect(repository).toContain('FallbackStorage.performRead');
    expect(repository).toContain('FallbackStorage.performWrite');
    expect(portal).toContain("if (!response.ok || payload?.success === false)");
    expect(portal).toContain('تم تسجيل بيانات المستند بنجاح.');
    expect(portal).toContain('/document-content?');
    expect(portal).toContain("window.open(content.url, '_blank', 'noopener,noreferrer')");
  });
});

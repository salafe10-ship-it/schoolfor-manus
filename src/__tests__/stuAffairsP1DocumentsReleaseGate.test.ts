import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/modules/student-documents/presentation/StudentDocumentsPortal.tsx'), 'utf8');

describe('STU-AFFAIRS-P1-006-65 Documents Metadata release gate', () => {
  it('uses canonical state and version/hold guards for mutation capabilities', () => {
    expect(source).toContain('selected.document.lifecycle_status !== \'archived\'');
    expect(source).toContain('selected.document.lifecycle_status !== \'expired\'');
    expect(source).toContain('!selected.document.legal_hold');
    expect(source).toContain('selectedHasCurrentVersion');
  });

  it('keeps destructive actions confirmed and mutation-isolated', () => {
    expect(source).toContain('actionConfirmationInFlight.current');
    expect(source).toContain('requestActionConfirmation(\'archive\')');
    expect(source).toContain('requestActionConfirmation(\'restore\')');
    expect(source).toContain('لن تتم إعادة العملية تلقائيًا');
  });

  it('does not implement binary/storage capabilities in the metadata UI', () => {
    expect(source).toContain('رفع الملفات الثنائية وتنزيلها ومعاينتها وOCR والمسح الضوئي غير متاحة');
    expect(source).not.toContain('URL.createObjectURL');
    expect(source).not.toContain('window.open');
  });
});

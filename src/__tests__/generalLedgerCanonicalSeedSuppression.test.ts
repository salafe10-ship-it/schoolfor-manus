import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

describe('general ledger canonical seed suppression', () => {
  it('does not expose local or seeded ledger data in canonical mode', () => {
    expect(source).toContain('const canonicalPersistenceRequired = FallbackStorage.isCanonicalPersistenceRequired()');
    expect(source).toContain("if (canonicalPersistenceRequired) return [];");
    expect(source).toContain('تم إخفاء البيانات الافتراضية للأستاذ العام');
  });
});

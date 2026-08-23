import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('general ledger canonical RBAC read contract', () => {
  it('does not seed local roles, users, audit history, or drill-down identity in canonical mode', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');
    expect(file).toContain('if (canonicalPersistenceRequired) return [];');
    expect(file).toContain('if (canonicalPersistenceRequired) return null;');
    expect((file.match(/canonicalPersistenceRequired\) return/g) || []).length).toBeGreaterThanOrEqual(6);
  });
});

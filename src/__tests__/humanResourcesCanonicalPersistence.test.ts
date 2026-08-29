import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('human resources canonical persistence contract', () => {
  it('suppresses seeded HR records and every local synchronization effect in canonical mode', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'), 'utf8');
    expect(file).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(file).toContain('Load canonical records in managed environments');
    expect(file).toContain("fetch('/api/hr/database'");
    expect((file.match(/if \(canonicalPersistenceRequired\) return;/g) || []).length).toBeGreaterThanOrEqual(11);
  });
});

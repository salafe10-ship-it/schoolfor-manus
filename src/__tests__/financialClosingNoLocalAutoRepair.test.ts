import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('financial closing evidence safety', () => {
  it('guards auto-repair behind canonical persistence', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/FinancialClosingDashboard.tsx'), 'utf8');
    const handler = source.indexOf('const runAutoResolveAndConsistency');
    const guard = source.indexOf('if (!ensureCanonicalClosingPersistence()) return;', handler);
    expect(guard).toBeGreaterThan(handler);
    expect(source).not.toContain('أصبح ميزان المراجعة متزناً بنسبة 100%!');
  });

  it('guards the pre-close validation behind canonical persistence', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/FinancialClosingDashboard.tsx'), 'utf8');
    const handler = source.indexOf('const runDryRunValidation');
    const guard = source.indexOf('if (!ensureCanonicalClosingPersistence()) return;', handler);
    expect(guard).toBeGreaterThan(handler);
  });
});

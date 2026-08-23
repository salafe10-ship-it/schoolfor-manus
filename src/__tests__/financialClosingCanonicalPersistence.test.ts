import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/FinancialClosingDashboard.tsx', 'utf8');

describe('financial closing canonical persistence contract', () => {
  it('does not load or mutate closing locks locally in canonical mode', () => {
    expect(source).toContain('const ensureCanonicalClosingPersistence');
    expect(source).toContain('عمليات الإقفال وإعادة الفتح متوقفة');
    expect(source).toContain('if (FallbackStorage.isCanonicalPersistenceRequired())');
  });
});

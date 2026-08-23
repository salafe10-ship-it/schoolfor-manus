import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams schedule optimization persistence contract', () => {
  it('does not confirm optimization after a failed scheduler persistence', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('const persisted = await handleRunAutoScheduler();');
    expect(source).toContain('if (persisted === false) return;');
  });
});

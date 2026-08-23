import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('revenue recognition canonical persistence contract', () => {
  it('guards calendars, policies, schedules, entries, histories, and adjustments', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/RevenueRecognitionRepository.ts'), 'utf8');
    expect(file).toContain('FallbackStorage.assertCanonicalPersistence');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(20);
    expect(file).toContain("this.assertAuthoritativePersistence('entry write');");
    expect(file).toContain("this.assertAuthoritativePersistence('adjustment write');");
  });
});

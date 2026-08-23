import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('revenue recognition canonical guard contract', () => {
  it('fails closed before using local invoice and account masters', () => {
    const source = readFileSync('src/database/services/AcademicRevenueRecognitionEngine.ts', 'utf8');
    expect(source).toContain('revenue recognition account master read');
    expect(source).toContain('revenue recognition invoice read');
    expect(source).toContain('revenue recognition period invoice read');
    expect(source).toContain('revenue recognition adjustment invoice read');
  });
});

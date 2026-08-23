import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('transport and uniform canonical contract', () => {
  it('routes service reads and writes through guarded persistence helpers', () => {
    const transportation = readFileSync('src/database/repositories/TransportationRepository.ts', 'utf8');
    const uniform = readFileSync('src/database/repositories/UniformRepository.ts', 'utf8');
    expect(transportation).toContain('FallbackStorage.performRead');
    expect(transportation).toContain('FallbackStorage.performWrite');
    expect(uniform).toContain('FallbackStorage.performRead');
    expect(uniform).toContain('FallbackStorage.performWrite');
  });
});

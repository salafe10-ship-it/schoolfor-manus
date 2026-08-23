import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('guardian and contact canonical contract', () => {
  it('routes sensitive relationship reads and writes through guarded persistence', () => {
    const guardian = readFileSync('src/database/repositories/GuardianRepository.ts', 'utf8');
    const studentGuardian = readFileSync('src/database/repositories/StudentGuardianRepository.ts', 'utf8');
    const contact = readFileSync('src/database/repositories/StudentContactRepository.ts', 'utf8');
    expect(guardian).toContain('FallbackStorage.performRead');
    expect(studentGuardian).toContain('FallbackStorage.performRead');
    expect(contact).toContain('FallbackStorage.performRead');
    expect(contact).toContain('FallbackStorage.performWrite');
  });
});

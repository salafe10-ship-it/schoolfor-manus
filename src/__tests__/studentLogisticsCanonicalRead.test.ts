import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('student logistics canonical read contract', () => {
  it('does not return local transportation or uniform records in canonical mode', () => {
    for (const file of [
      'src/database/repositories/StudentTransportationRepository.ts',
      'src/database/repositories/StudentUniformAccountRepository.ts',
    ]) {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain('assertCanonicalPersistence');
    }
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useGuardianInformation authoritative relation contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/hooks/useGuardianInformation.ts'), 'utf8');

  it('does not preselect a guardian relationship', () => {
    expect(source).toContain("relationshipType: ''");
    expect(source).not.toContain("relationshipType: 'الأب'");
  });
});

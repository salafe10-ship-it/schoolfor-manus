import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/PermissionsManagementModule.tsx'),
  'utf8',
);

describe('permissions employee evidence safety', () => {
  it('does not seed the employee directory when canonical data is absent', () => {
    expect(source).toContain('return [];');
    expect(source).toContain("useState<string>('')");
    expect(source).not.toContain('return INITIAL_EMPLOYEES_LIST;');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/school/SchoolUsersPermissionsModule.tsx', 'utf8');

describe('school identity evidence safety', () => {
  it('starts empty and hydrates only from the canonical school API', () => {
    expect(source).toContain('const [users, setUsers] = useState<SchoolUser[]>([])');
    expect(source).toContain("authenticatedRequest('/api/school/users'");
    expect(source).not.toContain('INITIAL_EMPLOYEES_LIST');
    expect(source).not.toContain('perm_test_');
  });
});

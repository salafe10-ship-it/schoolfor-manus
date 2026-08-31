import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminAudit.tsx'),
  'utf8',
);

describe('super admin audit evidence safety', () => {
  it('loads immutable audit history from the canonical API only', () => {
    expect(source).toContain('const [logs, setLogs] = useState<any[]>([]);');
    expect(source).toContain("authenticatedRequest('/api/admin/central/audit?limit=500')");
    expect(source).toContain('سجل التدقيق المركزي غير قابل للمحو');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain("id: 'log_01'");
    expect(source).not.toContain('185.220.101.44');
  });
});

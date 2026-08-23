import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('super admin dashboard integrity', () => {
  it('does not seed telemetry or system logs', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminDashboard.tsx'), 'utf8');
    expect(source).toContain('const [logs, setLogs] = useState<string[]>([]);');
    expect(source).toContain('cpu: 0');
    expect(source).toContain('activeSessions: 0');
    expect(source).not.toContain('Booting multi-tenant proxy');
    expect(source).not.toContain('onlineUsers: 485');
  });
});

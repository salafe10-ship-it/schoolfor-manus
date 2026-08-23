import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('operations center integrity', () => {
  it('does not seed backup logs, alerts, live logs, or telemetry', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminOperationsCenter.tsx'), 'utf8');
    expect(source).toContain('const [backupLogs, setBackupLogs] = useState<any[]>(() => {\n    return [];');
    expect(source).toContain('const [liveLogs, setLiveLogs] = useState<string[]>([]);');
    expect(source).toContain('const [alerts, setAlerts] = useState<any[]>([]);');
    expect(source).toContain('const [telemetryHistory, setTelemetryHistory] = useState<number[]>([]);');
    expect(source).not.toContain('op_al_01');
    expect(source).not.toContain('b_01');
  });
});

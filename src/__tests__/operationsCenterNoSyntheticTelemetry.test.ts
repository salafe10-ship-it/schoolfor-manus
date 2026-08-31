import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('operations center integrity', () => {
  it('does not seed backup logs, alerts, live logs, or telemetry', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminOperationsCenter.tsx'), 'utf8');
    expect(source).toContain('const backupLogs: any[] = [];');
    expect(source).toContain('const alerts: any[] = [];');
    expect(source).not.toContain('const [liveLogs, setLiveLogs]');
    expect(source).not.toContain('const [telemetryHistory, setTelemetryHistory]');
    expect(source).not.toContain("style={{ width: '0%' }}");
    expect(source).toContain('لا توجد سجلات تشغيل حية موثقة');
    expect(source).not.toContain('op_al_01');
    expect(source).not.toContain('b_01');
  });
});

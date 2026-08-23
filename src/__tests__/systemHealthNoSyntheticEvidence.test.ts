import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('system health evidence integrity', () => {
  it('does not seed workflows, automation, audit, backups, or security claims', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SystemHealthCenter.tsx'), 'utf8');
    expect(source).toContain('const [workflows, setWorkflows] = useState<any[]>([]);');
    expect(source).toContain('const [automationRecipes, setAutomationRecipes] = useState<any[]>([]);');
    expect(source).toContain('const [auditRecords, setAuditRecords] = useState<any[]>([]);');
    expect(source).toContain('const [backupFiles, setBackupFiles] = useState<any[]>([]);');
    expect(source).toContain('const [securityScore, setSecurityScore] = useState<number>(0);');
    expect(source).toContain('const [archivedLogs, setArchivedLogs] = useState<any[]>([]);');
    expect(source).toContain('const [replicaLogs, setReplicaLogs] = useState<any[]>([]);');
    expect(source).toContain('const [redisLogs, setRedisLogs] = useState<any[]>([]);');
    expect(source).toContain('const [healthScore, setHealthScore] = useState<number>(0);');
    expect(source).toContain('const [selectedSchoolScale, setSelectedSchoolScale] = useState<number>(0);');
    expect(source).not.toContain('latency: 22');
    expect(source).toContain("healthReport.totalCheckedModules : 0");
    expect(source).toContain("healthReport.totalCheckedScreens : 0");
    expect(source).toContain("غير متحقق لغياب القياس");
    expect(source).toContain("بانتظار قياس مركزي");
    expect(source).not.toContain('backup_school_1_snapshot_20260702_01.sql');
    expect(source).not.toContain("securityScore, setSecurityScore] = useState<number>(100)");
  });
});

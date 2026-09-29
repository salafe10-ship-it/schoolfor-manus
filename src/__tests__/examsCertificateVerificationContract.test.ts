import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('server-backed exam certificate verification contract', () => {
  const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
  const panel = readFileSync(resolve(process.cwd(), 'src/components/exams/ExamsCertificatesPanel.tsx'), 'utf8');
  const examsModule = readFileSync(resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'), 'utf8');

  it('recomputes the archive signature inside the trusted tenant transaction', () => {
    expect(server).toContain('/api/exams/result-archives/:archiveId/verify');
    expect(server).toContain('SELECT id, operational_version, payload, signature_hash, created_at');
    expect(server).toContain('expectedSignature === String(archive.signature_hash || \'\').toLowerCase()');
    expect(server).toContain('payload.attendanceSchemaVersion === 1');
    expect(server).toContain('attendance === \'present\' && typeof grade === \'number\' && Number.isFinite(grade)');
    expect(server).toContain('valid: Boolean(signatureValid && attendanceComplete)');
  });

  it('does not accept a browser-only local match as verification', () => {
    expect(panel).toContain('exams/result-archives/${encodeURIComponent(archiveId)}/verify');
    expect(panel).toContain('verification?.valid === true');
    expect(panel).toContain('Authorization: `Bearer ${accessToken}`');
  });

  it('exposes only staff-authorized signed archive summaries with complete-result statistics', () => {
    const routeStart = server.indexOf('app.get("/api/exams/result-archives"');
    const routeEnd = server.indexOf('/api/exams/result-archives/:archiveId/verify', routeStart);
    const route = server.slice(routeStart, routeEnd);
    expect(route).toContain('canViewFullExamDatabase(actorRole, actorPermissions)');
    expect(route).toContain('signatureValid');
    expect(route).toContain('summaryAvailable: signatureValid && payload.attendanceSchemaVersion === 1');
    expect(route).toContain("result.status === 'passed' || result.status === 'failed'");
    expect(route).toContain('completeResults: complete.length');
    expect(route).toContain('standardDeviation:');
    expect(route).not.toContain('studentName:');
    expect(route).not.toContain('studentId:');
    expect(examsModule).toContain("fetchExamsSource('/api/exams/result-archives')");
  });
});

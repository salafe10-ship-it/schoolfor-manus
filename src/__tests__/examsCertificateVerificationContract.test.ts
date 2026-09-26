import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('server-backed exam certificate verification contract', () => {
  const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
  const panel = readFileSync(resolve(process.cwd(), 'src/components/exams/ExamsCertificatesPanel.tsx'), 'utf8');

  it('recomputes the archive signature inside the trusted tenant transaction', () => {
    expect(server).toContain('/api/exams/result-archives/:archiveId/verify');
    expect(server).toContain('SELECT id, operational_version, payload, signature_hash, created_at');
    expect(server).toContain('expectedSignature === String(archive.signature_hash || \'\').toLowerCase()');
    expect(server).toContain('valid: Boolean(signatureValid && student)');
  });

  it('does not accept a browser-only local match as verification', () => {
    expect(panel).toContain('exams/result-archives/${encodeURIComponent(archiveId)}/verify');
    expect(panel).toContain('verification?.valid === true');
    expect(panel).toContain('Authorization: `Bearer ${accessToken}`');
  });
});

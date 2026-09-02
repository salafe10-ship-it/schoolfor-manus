import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

describe('customer response privacy boundary', () => {
  it('keeps public liveness and readiness responses free of runtime and database detail', () => {
    const health = server.slice(server.indexOf('app.get("/api/health"'), server.indexOf('app.get("/api/ready"'));
    const ready = server.slice(server.indexOf('app.get("/api/ready"'), server.indexOf('"/api/internal/staging/connection-identity"'));
    expect(health).not.toContain('tenantIsolationMode');
    expect(health).not.toContain('architecture:');
    expect(ready).not.toContain('data: readiness');
    expect(ready).toContain("data: { ready: readiness.ready, status:");
  });

  it('makes diagnostics and database controls platform-only and redacts error details for school users', () => {
    const diagnostics = server.slice(server.indexOf('"/api/internal/staging/connection-identity"'), server.indexOf('// GET all Audit Logs'));
    const errorHandler = server.slice(server.indexOf('// UNIFIED CENTRAL ERROR HANDLER MIDDLEWARE'));
    expect(diagnostics).toMatch(/requirePermissionOnly\(PERMISSIONS\.PLATFORM_ADMIN\)/);
    expect(errorHandler).toContain('const isPlatformAdmin');
    expect(errorHandler).toContain('errorCode: publicErrorCode');
    expect(errorHandler).not.toContain('details,\n      traceId,\n      timestamp\n    });');
  });
});

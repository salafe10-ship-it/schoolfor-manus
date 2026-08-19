import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync('server.ts', 'utf8');

describe('safe GET /api/students auth trace', () => {
  it('is explicitly gated and emits only non-secret diagnostic fields', () => {
    expect(serverSource).toContain("process.env.AUTH_TRACE_ENABLED === 'true'");
    expect(serverSource).toContain("process.env.EDUPRO_ENVIRONMENT !== 'production'");
    expect(serverSource).toContain("supabase_project_ref: supabaseProjectRef()");
    expect(serverSource).toContain('token_length: trace.tokenLength');
    expect(serverSource).toContain('required_permission: trace.requiredPermission');
    expect(serverSource).toContain('student_view_found: trace.studentViewFound');
    expect(serverSource).toContain('tenant_scope_valid: trace.tenantScopeValid');
    expect(serverSource).toContain("EnterpriseLogger.info('PERMISSION-TRACE', 'PermissionTrace'");
    expect(serverSource).not.toContain('authorization_value');
    expect(serverSource).not.toContain('jwt: token');
    expect(serverSource).not.toContain('password: password');
    expect(serverSource).not.toContain('connectionString:');
  });
});

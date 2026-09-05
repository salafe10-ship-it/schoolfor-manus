import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('owner workspace and targeted release contract', () => {
  it('keeps templates and school releases in the closed platform control plane', () => {
    const migration = read('supabase/migrations/202609051100_owner_workspace_releases.sql');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.platform_templates');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.platform_school_releases');
    expect(migration).toContain('ALTER TABLE public.platform_templates ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('REVOKE ALL ON TABLE public.platform_school_releases FROM anon, authenticated');
  });

  it('requires an explicit release scope and writes versioned target records', () => {
    const server = read('server.ts');
    expect(server).toContain("app.post('/api/admin/central/releases', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(server).toContain("['school', 'selected', 'global']");
    expect(server).toContain('COALESCE(MAX(release_version), 0) + 1');
    expect(server).toContain("app.post('/api/admin/central/releases/:releaseId/rollback'");
    expect(server).toContain("app.get('/api/school/workspace', authenticateRequest");
    expect(server).not.toContain('req.body.schoolId');
    expect(server).not.toContain('req.body.school_id');
  });

  it('renders the owner control surface and keeps school feature flags server-derived', () => {
    const component = read('src/components/super-admin/SuperAdminWorkspaceControl.tsx');
    const identity = read('src/middleware/trustedSchoolIdentity.ts');
    expect(component).toContain('مركز المالك ونشر التحديثات الموجّه');
    expect(component).toContain("scope === 'global'");
    expect(component).toContain('/api/admin/central/releases');
    expect(identity).toContain('Safe, boolean-only feature flags');
    expect(identity).toContain('typeof value === \'boolean\'');
  });
});

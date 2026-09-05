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

  it('binds the owner school to the central boundary and excludes it from global customer rollouts', () => {
    const server = read('server.ts');
    const reset = read('scripts/reset-to-single-school.ts');
    expect(reset).toContain("portal_profile: 'owner_controlled'");
    expect(reset).toContain("mode: 'owner'");
    expect(server).toContain("isOwnerWorkspaceMetadata");
    expect(server).toContain("central_metadata->>'portal_profile', '') <> 'owner_controlled'");
    expect(server).toContain("isOwnerWorkspace: isOwnerWorkspaceMetadata(metadata)");
  });

  it('requires an explicit owner school and a directly linked platform identity for activation', () => {
    const script = read('scripts/bind-owner-school.ts');
    expect(script).toContain('OWNER_SCHOOL_BIND_CONFIRMATION');
    expect(script).toContain('OWNER_SCHOOL_ID');
    expect(script).toContain('OWNER_AUTH_USER_ID');
    expect(script).toContain("pr.role_key = 'platformadmin'");
    expect(script).toContain("portal_profile: 'owner_controlled'");
  });

  it('applies the newest published owner template during school creation', () => {
    const server = read('server.ts');
    expect(server).toContain("لا يوجد قالب مالك منشور؛ انشر قالبًا قبل فتح مدرسة جديدة.");
    expect(server).toContain("release_kind: 'template'");
    expect(server).toContain('تطبيق تلقائي للقالب المنشور عند إنشاء المدرسة.');
    expect(server).toContain('templateManifest: effectiveManifest');
    expect(server).toContain('template: defaultManifest');
  });

  it('allows templates to be created only from the bound owner school', () => {
    const server = read('server.ts');
    expect(server).toContain("central_metadata->>'portal_profile') = 'owner_controlled'");
    expect(server).toContain('قوالب المنصة يجب أن تُنشأ من مدرسة المالك فقط.');
    expect(server).toContain('const sourceSchoolId = requestedSourceSchoolId || ownerSchool.rows[0].id');
  });

  it('keeps school changes as overrides while resolving the latest template at read time', () => {
    const server = read('server.ts');
    const component = read('src/components/super-admin/SuperAdminWorkspaceControl.tsx');
    expect(server).toContain('mergeTemplateManifest(');
    expect(server).toContain('t.manifest AS template_manifest');
    expect(server).toContain('r.feature_overrides');
    expect(server).toContain('overrides: manifestOverrides');
    expect(component).toContain('diffFeatures(features, templateFeatures)');
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

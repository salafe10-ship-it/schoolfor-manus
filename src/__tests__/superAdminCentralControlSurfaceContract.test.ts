import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('central administration control-surface contract', () => {
  it('keeps the operations center free of local authority and synthetic telemetry', () => {
    const source = read('src/components/super-admin/SuperAdminOperationsCenter.tsx');
    expect(source).not.toContain('Math.random');
    expect(source).not.toContain('setInterval');
    expect(source).not.toContain('setTimeout');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('erp_tenant_modules_v1');
    expect(source).not.toContain("style={{ width: '0%' }}");
    expect(source).not.toContain('2026-07-14');
    expect(source).not.toContain('Math.round((activeSchoolsCount/totalSchools)*100)');
    expect(source).toContain("config.active === true ? 'نشط ومصرح به' : config.active === false ? 'محظور من الاستخدام' : 'غير متحقق'");
    expect(source).toContain('موصل التحقق الذاتي للمخدمات غير متاح');
    expect(source).toContain('موصل جدولة النسخ المركزي غير متاح');
  });

  it('does not expose backup progress or a local snapshot directory without a storage connector', () => {
    const source = read('src/components/super-admin/SuperAdminBackups.tsx');
    expect(source).toContain('const backups: any[] = [];');
    expect(source).toContain('طلب لقطة فورية');
    expect(source).not.toContain('const [backups, setBackups]');
    expect(source).not.toContain('retentionCount: 30');
    expect(source).not.toContain('backupProgress');
    expect(source).toContain('خدمة التخزين المركزية غير متصلة أو غير موثقة');
  });

  it('does not render zero-valued health bars as if they were measurements', () => {
    const source = read('src/components/super-admin/SuperAdminHealth.tsx');
    expect(source).not.toContain("style={{ width: '0%' }}");
    expect(source).toContain('لا توجد قراءة موثقة');
  });

  it('fails developer operations closed without browser-side SQL or deployment claims', () => {
    const source = read('src/developer/DeveloperPlatformCenter.tsx');
    expect(source).not.toContain('Math.random');
    expect(source).not.toContain('setInterval');
    expect(source).not.toContain('setTimeout');
    expect(source).not.toContain('localStorage');
    expect(source).toContain('Browser SQL execution is disabled');
    expect(source).toContain('موصل CI/CD غير متاح');
    expect(source).toContain('موصل Redis المركزي غير متاح');
  });

  it('defaults school features to denied until the canonical directory enables them', () => {
    const source = read('src/components/super-admin/SuperAdminFeatures.tsx');
    expect(source).toContain('return activeSchool.features || {};');
    expect(source).toContain('getSchoolFeatures()[feat.key] === true');
    expect(source).not.toContain('activeSchool.features || {\n      students: true');
  });

  it('exposes immutable central audit evidence behind platform-admin authorization', () => {
    const server = read('server.ts');
    expect(server).toContain("app.get('/api/admin/central/audit', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(server).toContain('FROM public.audit_events ae');
    expect(server).toContain('FROM public.audit_access_events aa');
    expect(server).toContain("app.use('/api/admin/central'");
    expect(server).toContain('INSERT INTO public.audit_access_events');
    expect(server).toContain('auth_user_id = $2::uuid');
    expect(server).toContain('canonicalActorUserId');
    expect(server).not.toContain("'requestPath', aa.request_path) || aa.metadata");
  });

  it('does not trust browser storage as an active support session', () => {
    const app = read('src/App.tsx');
    expect(app).not.toContain("localStorage.getItem('impersonation_active')");
    expect(app).not.toContain('setIsImpersonating');
  });
});

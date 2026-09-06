import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('central incident command center', () => {
  it('stores incidents and immutable team timelines in the closed control plane', () => {
    const migration = read('supabase/migrations/202609061000_central_incident_command.sql');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.platform_incidents');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.platform_incident_events');
    expect(migration).toContain('ALTER TABLE public.platform_incidents ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('REVOKE ALL ON TABLE public.platform_incident_events FROM anon, authenticated');
    expect(migration).not.toContain('ON DELETE CASCADE');
  });

  it('provides platform-admin-only incident discovery and workflow routes', () => {
    const server = read('server.ts');
    expect(server).toContain("app.get('/api/admin/central/incidents', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(server).toContain("app.post('/api/admin/central/incidents', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(server).toContain("app.patch('/api/admin/central/incidents/:incidentId', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(server).toContain('expectedVersion');
    expect(server).toContain('حدّث عضو آخر هذه الحادثة');
    expect(server).toContain("ae.action = 'SYSTEM_CRITICAL_ERROR'");
  });

  it('enforces a complete detection-to-closure workflow without deletion', () => {
    const server = read('server.ts');
    expect(server).toContain("detected: ['triaged']");
    expect(server).toContain("assigned: ['in_progress']");
    expect(server).toContain("in_progress: ['monitoring']");
    expect(server).toContain("if (!['in_progress', 'monitoring'].includes(current.status))");
    expect(server).toContain("if (current.status !== 'resolved')");
    expect(server).not.toContain("app.delete('/api/admin/central/incidents");
  });

  it('limits incident ownership to active platform administrators', () => {
    const server = read('server.ts');
    const component = read('src/components/super-admin/SuperAdminIncidentCommandCenter.tsx');
    expect(server).toContain("pr.role_key = 'platformadmin'");
    expect(server).toContain('incidentAssignableTeamSelect');
    expect(server).toContain('team: teamResult.rows');
    expect(server).toContain('WHERE event_position <= 30');
    expect(component).toContain('setTeam(Array.isArray(incidentPayload.team) ? incidentPayload.team : [])');
    expect(component).not.toContain("authenticatedRequest('/api/admin/central/users'");
  });

  it('renders team assignment, SLA, signals, root cause, and linked operational tools', () => {
    const component = read('src/components/super-admin/SuperAdminIncidentCommandCenter.tsx');
    const view = read('src/components/SuperAdminView.tsx');
    expect(component).toContain('مركز قيادة الدعم ومعالجة مشاكل المدارس');
    expect(component).toContain('إشارات تحتاج مراجعة');
    expect(component).toContain('SLA متجاوز');
    expect(component).toContain('إسناد لعضو الفريق');
    expect(component).toContain('السبب الجذري');
    expect(component).toContain("onNavigateToTab?.('workspace_control')");
    expect(view).toContain("useState<string>('incident_command')");
    expect(view).toContain('مركز الدعم والفريق');
  });
});

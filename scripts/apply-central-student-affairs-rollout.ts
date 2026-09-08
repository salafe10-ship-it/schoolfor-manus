import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const EXPECTED_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const REQUIRED_CONFIRMATION = 'APPLY_CENTRAL_STUDENT_AFFAIRS_ROLLOUT';

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('PRODUCTION_ROLLOUT_REQUIRES_APPROVED_RELEASE_PIPELINE');
  if (required(process.env.CENTRAL_STUDENT_AFFAIRS_ROLLOUT_CONFIRMATION, 'CENTRAL_STUDENT_AFFAIRS_ROLLOUT_CONFIRMATION_REQUIRED') !== REQUIRED_CONFIRMATION) {
    throw new Error('CENTRAL_STUDENT_AFFAIRS_ROLLOUT_CONFIRMATION_INVALID');
  }
  const connectionString = required(process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL, 'DATABASE_CONNECTION_REQUIRED');
  const supabaseUrl = required(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, 'SUPABASE_URL_REQUIRED');
  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 8_000), ssl: { rejectUnauthorized: false } });
  const migration = await readFile(resolve(process.cwd(), 'supabase/migrations/202609081000_student_affairs_canonical_alignment.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);

    const templateResult = await client.query(`
      SELECT id, template_key, version, name, manifest
        FROM public.platform_templates
       WHERE template_key = 'central-schools-default' AND status = 'published'
       ORDER BY version DESC
       LIMIT 1
       FOR UPDATE
    `);
    const template = templateResult.rows[0];
    if (!template) throw new Error('CENTRAL_TEMPLATE_NOT_FOUND');

    const targetResult = await client.query(`
      SELECT id, tenant_id, display_name, central_metadata
        FROM public.schools
       WHERE status = 'active' AND deleted_at IS NULL
         AND COALESCE(central_metadata->>'portal_profile', '') <> 'owner_controlled'
         AND COALESCE(central_metadata->'ownerWorkspace'->>'mode', '') <> 'owner'
       ORDER BY created_at
       FOR UPDATE
    `);

    const actorResult = await client.query(`
      SELECT created_by_auth_user_id
        FROM public.platform_templates
       WHERE id = $1::uuid
       LIMIT 1
    `, [template.id]);
    const actorAuthUserId = actorResult.rows[0]?.created_by_auth_user_id || null;
    if (!actorAuthUserId) throw new Error('CENTRAL_TEMPLATE_ACTOR_MISSING');

    const releases: Array<{ schoolId: string; schoolName: string; releaseId: string; releaseVersion: number }> = [];
    for (const target of targetResult.rows) {
      const metadata = objectValue(target.central_metadata);
      const workspace = objectValue(metadata.ownerWorkspace);
      const versionResult = await client.query(`
        SELECT COALESCE(MAX(release_version), 0) + 1 AS next_version
          FROM public.platform_school_releases
         WHERE school_id = $1::uuid
      `, [target.id]);
      const releaseVersion = Number(versionResult.rows[0]?.next_version || 1);
      const releaseId = randomUUID();
      const releaseTitle = `تحديث شؤون الطلاب من ${template.name} — الإصدار ${template.version}`;
      const nextMetadata = {
        ...metadata,
        ownerWorkspace: {
          ...workspace,
          mode: 'customer',
          releaseChannel: 'stable',
          currentReleaseId: releaseId,
          currentReleaseVersion: releaseVersion,
          templateId: template.id,
          templateKey: template.template_key,
          templateVersion: template.version,
          lastReleaseTitle: releaseTitle,
          lastReleaseAt: new Date().toISOString(),
        },
      };
      await client.query(`
        INSERT INTO public.platform_school_releases
          (id, school_id, template_id, release_version, release_kind, scope, channel, status,
           title, notes, feature_overrides, payload, created_by_auth_user_id)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'template', 'global', 'stable', 'active',
                $5, $6, '{}'::jsonb, $7::jsonb, $8::uuid)
      `, [
        releaseId, target.id, template.id, releaseVersion, releaseTitle,
        'توزيع مركزي لإصلاحات وحدة شؤون الطلاب؛ لا يشمل بيانات التشغيل الخاصة بالمدرسة.',
        JSON.stringify({ templateKey: template.template_key, templateVersion: template.version, scope: 'student-affairs', automaticPropagation: true }),
        actorAuthUserId,
      ]);
      await client.query(`UPDATE public.schools SET central_metadata = $2::jsonb, updated_at = now(), version = version + 1 WHERE id = $1::uuid`, [target.id, JSON.stringify(nextMetadata)]);
      releases.push({ schoolId: target.id, schoolName: target.display_name, releaseId, releaseVersion });
    }

    const verification = await client.query(`
      SELECT
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='national_id') AS national_id,
        EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_students_school_national_id_live') AS identity_index,
        (SELECT COUNT(*)::int FROM public.schools WHERE status='active' AND deleted_at IS NULL) AS active_schools,
        (SELECT COUNT(*)::int FROM public.platform_school_releases WHERE template_id=$1::uuid AND status='active') AS active_releases
    `, [template.id]);
    await client.query('COMMIT');
    console.log(JSON.stringify({ success: true, template: { id: template.id, key: template.template_key, version: template.version }, targets: releases, verification: verification.rows[0] }, null, 2));
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

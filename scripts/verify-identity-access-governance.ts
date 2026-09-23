import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('ADMIN_DATABASE_CONNECTION_REQUIRED');

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000, ssl: { rejectUnauthorized: false } });
try {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      requests_table: boolean;
      approvals_table: boolean;
      grants_table: boolean;
      requests_rls: boolean;
      requests_force_rls: boolean;
      approvals_rls: boolean;
      approvals_force_rls: boolean;
      grants_rls: boolean;
      request_columns: number;
      approval_columns: number;
      grant_time_columns: number;
      request_fk_count: number;
      approval_fk_count: number;
      grant_fk_count: number;
    }>(`
      SELECT
        to_regclass('public.identity_access_requests') IS NOT NULL AS requests_table,
        to_regclass('public.identity_access_request_approvals') IS NOT NULL AS approvals_table,
        to_regclass('public.user_permission_grants') IS NOT NULL AS grants_table,
        COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='identity_access_requests'), false) AS requests_rls,
        COALESCE((SELECT c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='identity_access_requests'), false) AS requests_force_rls,
        COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='identity_access_request_approvals'), false) AS approvals_rls,
        COALESCE((SELECT c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='identity_access_request_approvals'), false) AS approvals_force_rls,
        COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='user_permission_grants'), false) AS grants_rls,
        (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='identity_access_requests' AND column_name IN ('reason','status','starts_at','ends_at','permission_keys','decision_reason'))::int AS request_columns,
        (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='identity_access_request_approvals' AND column_name IN ('request_id','approver_id','status','decision_reason','decided_at'))::int AS approval_columns,
        (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='user_permission_grants' AND column_name IN ('starts_at','ends_at'))::int AS grant_time_columns,
        (SELECT count(*) FROM pg_constraint WHERE conname IN ('identity_access_requests_tenant_fk','identity_access_requests_school_fk','identity_access_requests_user_fk','identity_access_requests_requested_by_fk'))::int AS request_fk_count,
        (SELECT count(*) FROM pg_constraint WHERE conname='identity_access_request_approvals_request_fk')::int AS approval_fk_count,
        (SELECT count(*) FROM pg_constraint WHERE conname IN ('user_permission_grants_user_fk','user_permission_grants_permission_fk'))::int AS grant_fk_count
    `);
    const verification = result.rows[0];
    const ok = verification.requests_table && verification.approvals_table && verification.grants_table
      && verification.requests_rls && verification.requests_force_rls
      && verification.approvals_rls && verification.approvals_force_rls && verification.grants_rls
      && verification.request_columns === 6 && verification.approval_columns === 5
      && verification.grant_time_columns === 2 && verification.request_fk_count === 4
      && verification.approval_fk_count === 1 && verification.grant_fk_count === 2;
    if (!ok) throw new Error(`IDENTITY_ACCESS_GOVERNANCE_NOT_READY: ${JSON.stringify(verification)}`);
    console.log(JSON.stringify({ success: true, verification }));
  } finally { client.release(); }
} finally { await pool.end(); }

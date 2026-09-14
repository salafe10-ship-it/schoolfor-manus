import { describe, expect, it } from 'vitest';
import {
  extractPostgresProjectRef,
  inspectSupabaseDatabaseTargetAlignment,
} from '../../server/security/SupabaseDatabaseTargetAlignment.js';

const projectRef = 'wjhraxvxvvthxqlpyohh';

describe('Supabase database target alignment', () => {
  it('accepts restricted and admin pooler users from the Auth project', () => {
    const result = inspectSupabaseDatabaseTargetAlignment({
      supabaseUrl: `https://${projectRef}.supabase.co`,
      databaseUrl: `postgresql://edupro_app.${projectRef}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
      platformAdminDatabaseUrl: `postgresql://postgres.${projectRef}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    });

    expect(result.aligned).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('accepts a direct Supabase database hostname', () => {
    expect(extractPostgresProjectRef(
      `postgresql://postgres:secret@db.${projectRef}.supabase.co:5432/postgres`,
    )).toBe(projectRef);
  });

  it('rejects a data plane connected to another Supabase project', () => {
    const result = inspectSupabaseDatabaseTargetAlignment({
      supabaseUrl: `https://${projectRef}.supabase.co`,
      databaseUrl: 'postgresql://edupro_app.aaaaaaaaaaaaaaaaaaaa:secret@aws-1-eu-central-1.pooler.supabase.com:5432/postgres',
      platformAdminDatabaseUrl: `postgresql://postgres.${projectRef}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    });

    expect(result.aligned).toBe(false);
    expect(result.issues).toContain('DATABASE_URL targets a different Supabase project than SUPABASE_URL.');
  });

  it('fails closed when the dedicated admin connection is missing', () => {
    const result = inspectSupabaseDatabaseTargetAlignment({
      supabaseUrl: `https://${projectRef}.supabase.co`,
      databaseUrl: `postgresql://edupro_app.${projectRef}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    });

    expect(result.aligned).toBe(false);
    expect(result.issues).toContain('PLATFORM_ADMIN_DATABASE_URL does not identify a Supabase project.');
  });
});

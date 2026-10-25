import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  missingStagingSecretKeys,
  validateStagingEnvironmentValues,
} from '../../scripts/prepare-staging-env.js';
import { STAGING_SUPABASE_PROJECT_REF } from '../../scripts/stagingDatabaseSafety.js';

const stagingDatabaseUrl = `postgresql://edupro_staging_app.${STAGING_SUPABASE_PROJECT_REF}:staging-test-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;
const stagingAdminDatabaseUrl = `postgresql://postgres.${STAGING_SUPABASE_PROJECT_REF}:staging-admin-test-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

function validStagingValues() {
  return {
    EDUPRO_ENVIRONMENT: 'staging',
    UAT35_TARGET: 'schoolfor-manus-staging',
    DATABASE_ROLE_EXPECTED: 'edupro_staging_app',
    SUPABASE_URL: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
    SUPABASE_ANON_KEY: 'staging-anon-test-value',
    SUPABASE_SERVICE_ROLE_KEY: 'staging-service-test-value',
    DATABASE_URL: stagingDatabaseUrl,
    PLATFORM_ADMIN_DATABASE_URL: stagingAdminDatabaseUrl,
    JWT_SECRET: 'staging-jwt-test-value',
    UAT_ALLOW_LOCAL_STAGING: 'false',
    RUNTIME_SCHEMA_BOOTSTRAP: 'false',
    AUTO_MIGRATE: 'false',
    AUTO_SEED: 'false',
    FINANCIAL_WRITES_LOCKED: 'true',
    FINANCIAL_ERP_MODE: 'read_only',
    UAT_FINANCIAL_BASE_URL: 'http://127.0.0.1:4179',
  };
}

describe('Staging environment restoration guard', () => {
  it('lists missing key names without disclosing values', () => {
    const values = { DATABASE_URL: 'do-not-print-this-secret' };
    const missing = missingStagingSecretKeys(values);
    expect(missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(missing.join(',')).not.toContain('do-not-print-this-secret');
  });

  it('accepts only the isolated Staging project and restricted application role', () => {
    expect(validateStagingEnvironmentValues(validStagingValues())).toMatchObject({
      projectRef: STAGING_SUPABASE_PROJECT_REF,
      databaseRole: 'edupro_staging_app',
      financialWritesLocked: true,
    });
    expect(() => validateStagingEnvironmentValues({
      ...validStagingValues(),
      SUPABASE_URL: 'https://wjhraxvxvvthxqlpyohh.supabase.co',
    })).toThrow('SUPABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
    expect(() => validateStagingEnvironmentValues({
      ...validStagingValues(),
      DATABASE_URL: `postgresql://postgres.wjhraxvxvvthxqlpyohh:staging-test-secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    })).toThrow('DATABASE_URL_MUST_TARGET_THE_ISOLATED_STAGING_PROJECT');
  });

  it('keeps automatic schema mutation disabled', () => {
    expect(() => validateStagingEnvironmentValues({ ...validStagingValues(), AUTO_MIGRATE: 'true' }))
      .toThrow('STAGING_AUTO_MIGRATE_MUST_REMAIN_DISABLED');
    expect(() => validateStagingEnvironmentValues({ ...validStagingValues(), AUTO_SEED: 'true' }))
      .toThrow('STAGING_AUTO_SEED_MUST_REMAIN_DISABLED');
  });

  it('ships a credential-free template with write and bootstrap locks enabled', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const template = dotenv.parse(fs.readFileSync(path.join(root, '.env.staging.example')));
    expect(template.SUPABASE_URL).toBe(`https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`);
    expect(template.FINANCIAL_WRITES_LOCKED).toBe('true');
    expect(template.RUNTIME_SCHEMA_BOOTSTRAP).toBe('false');
    expect(template.AUTO_MIGRATE).toBe('false');
    expect(template.AUTO_SEED).toBe('false');
    expect(missingStagingSecretKeys(template)).toHaveLength(5);
  });
});

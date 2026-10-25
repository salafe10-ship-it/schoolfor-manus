import { describe, expect, it } from 'vitest';
import { validateStagingWorkerConfig } from '../../scripts/cloudflare-staging-deploy.mjs';

const config = {
  name: 'schoolfor-manus-staging', account_id: '8eac6ae301c11ce0e6869933e5d53061',
  workers_dev: false, preview_urls: false,
  vars: { EDUPRO_ENVIRONMENT: 'staging', SUPABASE_URL: 'https://vjcjscqgmijgzagshsca.supabase.co',
    DATABASE_ROLE_EXPECTED: 'edupro_staging_app', FINANCIAL_WRITES_LOCKED: 'true' },
};

describe('Staging deployment isolation', () => {
  it('refuses production worker names, projects and routes before deployment', () => {
    expect(() => validateStagingWorkerConfig({ ...config, name: 'schoolfor-manus' }, { bootstrap: true }))
      .toThrow('STAGING_WORKER_IDENTITY_MISMATCH');
    expect(() => validateStagingWorkerConfig({ ...config, vars: { ...config.vars,
      SUPABASE_URL: 'https://wjhraxvxvvthxqlpyohh.supabase.co' } }, { bootstrap: true }))
      .toThrow('STAGING_WORKER_IDENTITY_MISMATCH');
    expect(() => validateStagingWorkerConfig({ ...config, routes: ['*.abdalsalamsoft.com/*'] }, { bootstrap: true }))
      .toThrow('STAGING_DEPLOY_REQUIRES_NO_CUSTOM_ROUTES_AND_LOCKED_FINANCIAL_WRITES');
  });
  it('requires explicit infrastructure-only bootstrap when no database binding exists', () => {
    expect(() => validateStagingWorkerConfig(config)).toThrow('STAGING_DATABASE_BINDINGS_REQUIRED_OR_USE_BOOTSTRAP');
    expect(() => validateStagingWorkerConfig(config, { bootstrap: true })).not.toThrow();
  });
  it('keeps public hostnames disabled until Worker-wide Access is verified', () => {
    expect(() => validateStagingWorkerConfig({ ...config, workers_dev: true }, { bootstrap: true }))
      .toThrow('STAGING_WORKER_ACCESS_MUST_BE_VERIFIED_BEFORE_PUBLIC_HOSTNAME');
    expect(() => validateStagingWorkerConfig({ ...config, workers_dev: true }, { bootstrap: true, accessVerified: true }))
      .not.toThrow();
    expect(() => validateStagingWorkerConfig({ ...config, preview_urls: true }, { bootstrap: true }))
      .toThrow('STAGING_WORKER_PREVIEW_URLS_MUST_REMAIN_DISABLED');
  });
  it('rejects unverified Hyperdrive origins even during bootstrap', () => {
    expect(() => validateStagingWorkerConfig({ ...config,
      hyperdrive: [{ binding: 'HYPERDRIVE', id: 'unverified-production-resource' }] }, { bootstrap: true }))
      .toThrow('STAGING_HYPERDRIVE_ORIGIN_NOT_VERIFIED');
  });
});

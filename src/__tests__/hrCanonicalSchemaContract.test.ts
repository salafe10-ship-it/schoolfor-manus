import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('HR canonical schema contract', () => {
  const source = readFileSync('supabase/migrations/202608271500_hr_canonical_records.sql', 'utf8');
  const payrollUpgrade = readFileSync('supabase/migrations/202608291000_hr_payroll_runs_snapshot.sql', 'utf8');

  it('keeps HR records isolated by tenant and school with no country-specific default', () => {
    expect(source).toContain('CREATE TABLE IF NOT EXISTS public.hr_database');
    expect(source).toContain("country_code text NOT NULL DEFAULT 'ZZ'");
    expect(source).toContain('tenant_id::text = current_setting');
    expect(source).toContain('school_id::text = current_setting');
  });

  it('stores flexible legal configuration and versioned source data without seed records', () => {
    expect(source).toContain('legal_configuration jsonb NOT NULL DEFAULT');
    expect(source).toContain('version bigint NOT NULL DEFAULT 0');
    expect(source).not.toContain('INSERT INTO public.hr_database');
  });

  it('adds payroll runs through a forward migration without rewriting the applied baseline', () => {
    expect(source).not.toContain('"payrollRuns"');
    expect(payrollUpgrade).toContain("jsonb_set(data, '{payrollRuns}', '[]'::jsonb, true)");
    expect(payrollUpgrade).toContain('version = version + 1');
    expect(payrollUpgrade).toContain("'schema_upgrade'");
  });
});

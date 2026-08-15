import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService } from '../database/services/DatabaseService';
import { DatabaseSeeder } from '../database/seed/init';

describe('PRODUCTION BLOCKERS — ROOT CAUSE REMEDIATION TESTS', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('BLOCKER-01: Startup Migration & Seed Separation', () => {
    it('TEST A1 & A2: Normal DatabaseService initialization does NOT trigger migrations or seeds by default', async () => {
      delete process.env.AUTO_MIGRATE;
      delete process.env.AUTO_SEED;

      const result = await DatabaseService.initialize();
      expect(result.migrated).toBeNull();
      expect(result.seeded).toBeNull();
    });

    it('TEST A3: DatabaseSeeder strictly rejects seeding in PRODUCTION environment', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_PRODUCTION_SEED;

      const seedResult = await DatabaseSeeder.seedAll();
      expect(seedResult.success).toBe(false);
      expect(seedResult.seededTables).toEqual([]);
    });
  });

  describe('BLOCKER-02: RLS Tenant Policy Versioning', () => {
    it('TEST B1: Versioned SQL migrations exist and contain RLS isolation policies', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const sqlPath = path.join(process.cwd(), 'src', 'database', 'migrations', 'student_affairs_tables.sql');

      expect(fs.existsSync(sqlPath)).toBe(true);
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      expect(sqlContent).toContain('ENABLE ROW LEVEL SECURITY');
      expect(sqlContent).toContain('CREATE POLICY guardians_tenant_isolation');
      expect(sqlContent).toContain('school_id');
    });
  });

  describe('BLOCKER-03: Operational Persistence Endpoint Structure', () => {
    it('TEST C1 & D1: Financial and Inventory database endpoints are configured in server.ts', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');

      expect(serverCode).toContain('/api/financial/database');
      expect(serverCode).toContain('/api/inventory/database');
    });
  });
});

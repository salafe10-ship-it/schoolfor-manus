import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('accounting period status update contract', () => {
  it('performs a central update and audit instead of returning a no-op success', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/AccountingPeriodRepository.ts'), 'utf8');
    expect(file).toContain(".from('accounting_periods')");
    expect(file).toContain('.update({ status })');
    expect(file).toContain("'UPDATE_PERIOD_STATUS'");
    expect(file).not.toContain('return true; //');
  });
});

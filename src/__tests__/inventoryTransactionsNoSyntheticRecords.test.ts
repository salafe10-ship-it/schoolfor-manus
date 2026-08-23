import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('inventory transaction integrity', () => {
  it('does not seed stock counts or movements', () => {
    const countSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/inventory/StockCountManager.tsx'), 'utf8');
    const movementSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/inventory/StockMovementManager.tsx'), 'utf8');
    expect(countSource).toContain('useState<any[]>([])');
    expect(movementSource).toContain('useState<any[]>([])');
    expect(countSource).not.toContain('AUD-2026-01');
    expect(movementSource).not.toContain('MV-2026-001');
    expect(movementSource).not.toContain('PO-99481');
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('stock movement integrity', () => {
  it('requires real inputs and keeps new movements pending approval', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/inventory/StockMovementManager.tsx'),
      'utf8'
    );
    expect(source).toContain("itemId: '',");
    expect(source).toContain("status: 'pending_approval'");
    expect(source).toContain('if (!selectedItem || !Number.isInteger(newMovement.quantity)');
    expect(source).toContain("if (mv.status !== 'approved')");
    expect(source).not.toContain("refNo: `REF-${Math.floor(1000 + Math.random() * 9000)}`");
  });
});

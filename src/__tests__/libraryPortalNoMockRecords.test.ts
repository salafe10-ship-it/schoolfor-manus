import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('library portal integrity', () => {
  it('starts without fabricated books or borrow records', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/LibraryPortal.tsx'),
      'utf8'
    );
    expect(source).toContain('useState<BookItem[]>([]);');
    expect(source).toContain('useState<BorrowRecord[]>([]);');
    expect(source).toContain('newBook.totalCopies) <= 0');
    expect(source).not.toContain('أحمد محمود العتيبي');
    expect(source).not.toContain('مقدمة ابن خلدون التاريخية');
  });
});
